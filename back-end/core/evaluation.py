# core/evaluation.py
import numpy as np
import torch
from sklearn.metrics import mean_squared_error, matthews_corrcoef, accuracy_score, roc_auc_score, classification_report
from sklearn.exceptions import NotFittedError

# Importe o módulo 'core.models' e a função 'carregar_modelos' separadamente.
# Não importe as variáveis de modelo diretamente no escopo global do módulo evaluation aqui.
import core.models  # << MODIFICAÇÃO AQUI
from core.models import carregar_modelos # << MODIFICAÇÃO AQUI
from core.database import cursor as global_db_cursor

# Estas são as variáveis globais que este módulo (evaluation.py) usará.
# Elas serão populadas pela função load_models_for_evaluation.
lstm_model_eval = None
rf_model_eval = None
xgb_model_eval = None

def load_models_for_evaluation():
    global lstm_model_eval, rf_model_eval, xgb_model_eval
    print("DEBUG [evaluation.load_models]: Chamando carregar_modelos() de core.models...")
    carregar_modelos()  # Esta chamada atualiza as globais DENTRO do módulo core.models
    
    # AGORA, acesse as variáveis globais ATUALIZADAS diretamente do módulo core.models
    # usando a referência do módulo.
    lstm_model_eval = core.models.model    # << MODIFICAÇÃO AQUI
    rf_model_eval = core.models.rf_model  # << MODIFICAÇÃO AQUI
    xgb_model_eval = core.models.xgb_model  # << MODIFICAÇÃO AQUI
    
    print(f"DEBUG [evaluation.load_models]: Após atribuição (acessando diretamente de core.models):")
    print(f"  lstm_model_eval tipo: {type(lstm_model_eval)}")
    
    is_rf_trained = hasattr(rf_model_eval, 'estimators_') and len(rf_model_eval.estimators_) > 0 if rf_model_eval else False
    is_xgb_trained = hasattr(xgb_model_eval, '_Booster') and xgb_model_eval._Booster is not None if xgb_model_eval else False
    
    print(f"  rf_model_eval tipo: {type(rf_model_eval)}, treinado? {is_rf_trained}")
    print(f"  xgb_model_eval tipo: {type(xgb_model_eval)}, treinado? {is_xgb_trained}")

    if not all([lstm_model_eval, rf_model_eval, xgb_model_eval]):
        print("AVISO [evaluation.load_models]: Um ou mais modelos de avaliação (lstm, rf, xgb) são None após tentativa de carregamento.")
    elif not (is_rf_trained and is_xgb_trained): # Adicionado para verificar se RF ou XGB não estão de fato treinados
         print("AVISO [evaluation.load_models]: Um ou mais modelos de avaliação (RF, XGB) foram atribuídos mas NÃO PARECEM TREINADOS.")


# ... (o resto de get_evaluation_data, predict_with_ensemble_for_evaluation, run_ensemble_evaluation permanece o mesmo)
# A lógica de verificação em predict_with_ensemble_for_evaluation já é robusta e deve funcionar
# corretamente quando load_models_for_evaluation atribuir os modelos treinados corretamente.

def get_evaluation_data(test_size=0.2):
    """
    Busca dados do banco e os divide para obter um conjunto de teste.
    NOTA: Para uma avaliação robusta, o ideal é ter um conjunto de teste fixo
    que não é usado no treinamento. Esta função cria um split a partir dos dados totais.
    """
    global_db_cursor.execute("SELECT temperatura, umidade, vento, enchente FROM clima")
    dados = global_db_cursor.fetchall()
    
    if not dados or len(dados) < 20: # Garante dados suficientes para um teste mínimo
        print("Dados insuficientes no banco para uma avaliação significativa.")
        return None, None

    np.random.shuffle(dados) # Embaralha para garantir aleatoriedade na divisão
    split_idx = int((1.0 - test_size) * len(dados))
    
    dados_teste = dados[split_idx:]
    
    if not dados_teste:
        print("Conjunto de teste vazio após a divisão.")
        return None, None
        
    X_test = np.array([d[:3] for d in dados_teste])
    y_test = np.array([d[3] for d in dados_teste]) # Valores reais (0 ou 1)
    
    return X_test, y_test

def predict_with_ensemble_for_evaluation(features_array):
    global lstm_model_eval, rf_model_eval, xgb_model_eval # Garante que estamos usando as globais do módulo

    print("DEBUG [evaluation.predict_ensemble]: Verificando modelos antes da predição...")
    # Verifica se os modelos foram carregados e parecem treinados
    if not rf_model_eval or not (hasattr(rf_model_eval, 'estimators_') and len(rf_model_eval.estimators_) > 0):
        print("ERRO FATAL [evaluation.predict_ensemble]: rf_model_eval não está treinado ou não foi carregado.")
        raise NotFittedError("Modelo Random Forest (rf_model_eval) não parece treinado ou não foi carregado.")
    
    if not xgb_model_eval or not (hasattr(xgb_model_eval, '_Booster') and xgb_model_eval._Booster is not None):
        print("ERRO FATAL [evaluation.predict_ensemble]: xgb_model_eval não está treinado ou não foi carregado.")
        raise NotFittedError("Modelo XGBoost (xgb_model_eval) não parece treinado ou não foi carregado.")

    if not lstm_model_eval or not isinstance(lstm_model_eval, torch.nn.Module): # Verificação básica para LSTM
        print("ERRO FATAL [evaluation.predict_ensemble]: lstm_model_eval não é um módulo PyTorch válido ou não foi carregado.")
        raise ValueError("Modelo LSTM (lstm_model_eval) não é válido ou não foi carregado.")

    ensemble_probs = []
    ensemble_classes = []

    for features_instance in features_array:
        # LSTM
        input_tensor = torch.tensor(np.array(features_instance).reshape(1, 1, -1), dtype=torch.float32)
        with torch.no_grad():
            lstm_pred_prob = lstm_model_eval(input_tensor).item()
        
        # Random Forest
        rf_pred_prob = rf_model_eval.predict_proba([features_instance])[0][1]
        
        # XGBoost
        xgb_pred_prob = xgb_model_eval.predict_proba([features_instance])[0][1]
        
        final_pred_prob = 0.5 * lstm_pred_prob + 0.3 * rf_pred_prob + 0.2 * xgb_pred_prob
        ensemble_probs.append(final_pred_prob)
        ensemble_classes.append(int(final_pred_prob > 0.5))
        
    return ensemble_probs, ensemble_classes

def run_ensemble_evaluation():
    print("Iniciando avaliação do ensemble...")
    load_models_for_evaluation()

    X_test, y_test_reais = get_evaluation_data(test_size=0.2)

    if X_test is None or y_test_reais is None or len(X_test) == 0:
        print("Avaliação cancelada: não foi possível obter dados de teste válidos.")
        return {} # Retorna um dicionário vazio em caso de falha

    try:
        ensemble_probs, ensemble_classes = predict_with_ensemble_for_evaluation(X_test)
    except Exception as e:
        print(f"Erro durante a predição do ensemble para avaliação: {e}")
        return {}

    if not ensemble_probs:
        print("Nenhuma previsão do ensemble foi gerada para avaliação.")
        return {}

    metrics = {}
    metrics['mse'] = mean_squared_error(y_test_reais, ensemble_probs)
    metrics['mcc'] = matthews_corrcoef(y_test_reais, ensemble_classes)
    metrics['accuracy'] = accuracy_score(y_test_reais, ensemble_classes)

    if len(np.unique(y_test_reais)) > 1:
        try:
            metrics['auc_roc'] = roc_auc_score(y_test_reais, ensemble_probs)
        except ValueError as e:
            metrics['auc_roc'] = "Não calculável (uma classe presente)"
    else:
        metrics['auc_roc'] = "Não calculável (uma classe presente)"

    print("\n--- Métricas de Avaliação do Ensemble ---")
    print(f"Erro Quadrático Médio (MSE): {metrics['mse']:.4f}")
    print(f"Coeficiente de Correlação de Matthews (MCC): {metrics['mcc']:.4f}")
    print(f"Acurácia do Ensemble: {metrics['accuracy']:.4f}")
    print(f"AUC-ROC do Ensemble: {metrics.get('auc_roc', 'N/A')}")
    print("--- Fim da Avaliação do Ensemble ---\n")

    return metrics
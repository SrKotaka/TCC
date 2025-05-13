# services/ensemble.py
# ... (outras importações)
import torch
import numpy as np
from fastapi import HTTPException
from sklearn.exceptions import NotFittedError # Adicione este import
from core.models import model, rf_model, xgb_model
from core.database import salvar_dados
from services.weather import get_weather_data

def predict_ensemble(lat, lon):
    # Verifica se as instâncias dos modelos existem
    if rf_model is None or xgb_model is None or model is None:
        raise HTTPException(status_code=500, detail="Um ou mais modelos não foram inicializados (são None).")

    # Verifica se os modelos RandomForest e XGBoost estão treinados
    rf_trained = hasattr(rf_model, 'estimators_') and rf_model.estimators_ and len(rf_model.estimators_) > 0
    xgb_trained = hasattr(xgb_model, '_Booster') and xgb_model._Booster is not None and hasattr(xgb_model, 'classes_') and xgb_model.classes_ is not None

    if not rf_trained:
        raise HTTPException(status_code=503, detail="Modelo Random Forest não está treinado. Aguarde o treinamento ou forneça dados.")
    if not xgb_trained:
        raise HTTPException(status_code=503, detail="Modelo XGBoost não está treinado. Aguarde o treinamento ou forneça dados.")
    # Para o modelo LSTM, o carregamento via load_state_dict é o principal.
    # Se houver uma verificação específica de "treinado" para LSTM que você precise, adicione-a.

    features = get_weather_data(lat, lon)
    if features is None:
        raise HTTPException(status_code=500, detail="Erro ao obter dados climáticos")

    input_tensor = torch.tensor(np.array(features).reshape(1, 1, -1), dtype=torch.float32)

    try:
        with torch.no_grad():
            lstm_pred_prob = model(input_tensor).item()

        rf_pred_prob = rf_model.predict_proba([features])[0][1]
        xgb_pred_prob = xgb_model.predict_proba([features])[0][1]

    except NotFittedError as e:
        print(f"ERRO DE PREDIÇÃO: Modelo não ajustado - {e}")
        # Este erro é crucial e indica que um modelo carregado não está realmente pronto.
        raise HTTPException(status_code=503, detail=f"Erro de predição: O modelo {type(e.estimator).__name__ if hasattr(e, 'estimator') else 'um modelo'} não está ajustado. Verifique os dados e o processo de treinamento.")
    except Exception as e:
        import traceback
        print(f"ERRO INESPERADO DE PREDIÇÃO: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro inesperado durante a predição: {str(e)}")

    final_pred_prob = 0.5 * lstm_pred_prob + 0.3 * rf_pred_prob + 0.2 * xgb_pred_prob
    final_pred_class = int(final_pred_prob > 0.5)

    # Salvar os dados e a predição ajudará a realimentar o sistema
    salvar_dados(*features, final_pred_class) 

    return {
        "enchente": bool(final_pred_class),
        "probabilidade": round(float(final_pred_prob), 4)
    }
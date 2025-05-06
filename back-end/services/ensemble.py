# services/ensemble.py
# ... (outras importações)
import torch
import numpy as np
from fastapi import HTTPException
from core.models import model, rf_model, xgb_model # Seus modelos globais
from core.database import salvar_dados
from services.weather import get_weather_data

def predict_ensemble(lat, lon):
    if rf_model is None or xgb_model is None or model is None:
        raise HTTPException(status_code=500, detail="Um ou mais modelos não carregados.")
    
    features = get_weather_data(lat, lon)
    if features is None:
        raise HTTPException(status_code=500, detail="Erro ao obter dados climáticos")
    
    input_tensor = torch.tensor(np.array(features).reshape(1, 1, -1), dtype=torch.float32)
    with torch.no_grad():
        lstm_pred_prob = model(input_tensor).item()
    
    # Alteração: Usar predict_proba para RF para obter probabilidade
    try:
        rf_pred_prob = rf_model.predict_proba([features])[0][1] # Probabilidade da classe 1 (enchente)
    except AttributeError: # Fallback se o modelo não tiver predict_proba ou não for o esperado
        rf_pred_prob = float(rf_model.predict([features])[0])


    xgb_pred_prob = xgb_model.predict_proba([features])[0][1] # Probabilidade da classe 1 (enchente)
    
    # Ensemble com probabilidades
    final_pred_prob = 0.5 * lstm_pred_prob + 0.3 * rf_pred_prob + 0.2 * xgb_pred_prob
    
    final_pred_class = int(final_pred_prob > 0.5)
    salvar_dados(*features, final_pred_class)
    
    return {
        "enchente": bool(final_pred_class),
        "probabilidade": round(float(final_pred_prob), 4)
    }
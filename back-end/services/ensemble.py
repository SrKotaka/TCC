import torch, numpy as np, os
from fastapi import HTTPException
from core.models import model, rf_model, xgb_model
from core.database import salvar_dados
from services.weather import get_weather_data

def predict_ensemble(lat, lon):
    if rf_model is None:
        raise HTTPException(status_code=500, detail="Modelo Random Forest não carregado.")
    features = get_weather_data(lat, lon)
    if features is None:
        raise HTTPException(status_code=500, detail="Erro ao obter dados climáticos")
    input_tensor = torch.tensor(np.array(features).reshape(1, 1, -1), dtype=torch.float32)
    with torch.no_grad():
        lstm_pred = model(input_tensor).item()
    rf_pred = rf_model.predict([features])[0]
    xgb_pred = xgb_model.predict_proba([features])[0][1]
    final_pred = 0.5 * lstm_pred + 0.3 * rf_pred + 0.2 * xgb_pred
    salvar_dados(*features, int(final_pred > 0.5))
    return {
    "enchente": bool(final_pred > 0.5),
    "probabilidade": round(float(final_pred), 4)
}

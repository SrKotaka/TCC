from fastapi import FastAPI
import numpy as np
import tensorflow as tf
import pickle

app = FastAPI()

# Carregar modelo treinado
model = tf.keras.models.load_model("modelo_lstm.h5")

# Carregar scaler
with open("scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

@app.get("/prever/")
async def prever(chuva: float, temp: float, nivel_rio: float):
    # Normalizar entrada
    entrada = np.array([[chuva, temp, nivel_rio]])
    entrada = scaler.transform(entrada)
    
    # Previsão
    previsao = model.predict(entrada)[0][0]
    
    # Definir nível de risco
    risco = "Baixo"
    if previsao > 0.7:
        risco = "Alto"
    elif previsao > 0.4:
        risco = "Médio"
    
    return {"previsao": float(previsao), "risco": risco}
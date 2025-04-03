import torch
import torch.nn as nn
import numpy as np
import sqlite3
import requests
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from threading import Thread
import os

# 🚀 Criar banco de dados SQLite
conn = sqlite3.connect("dados_climaticos.db", check_same_thread=False)
cursor = conn.cursor()
cursor.execute("""
    CREATE TABLE IF NOT EXISTS clima (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temperatura REAL,
        umidade REAL,
        vento REAL,
        enchente INTEGER
    )
""")
conn.commit()

def salvar_dados(temperatura, umidade, vento, enchente):
    cursor.execute("""INSERT INTO clima (temperatura, umidade, vento, enchente) VALUES (?, ?, ?, ?)""",
    (temperatura, umidade, vento, enchente))
    conn.commit()

# 🚀 Função para obter dados climáticos com tentativas em caso de erro
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

def get_weather_data(lat, lon, tentativas=3):
    url = f"http://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={lat},{lon}"
    for _ in range(tentativas):
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            return [data["current"]["temp_c"], data["current"]["humidity"], data["current"]["wind_kph"]]
        except Exception as e:
            print(f"Erro ao buscar dados climáticos: {e}. Tentando novamente...")
            time.sleep(2)
    return None

# 🚀 Criar modelo LSTM otimizado
class LSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, output_size):
        super(LSTMModel, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])
        return torch.sigmoid(out)

model = LSTMModel(3, 50, 2, 1)

def carregar_modelo():
    modelo_path = "modelo_lstm.pth"
    if os.path.exists(modelo_path):
        try:
            model.load_state_dict(torch.load(modelo_path))
            model.eval()
            print("✅ Modelo carregado com sucesso!")
        except Exception as e:
            print(f"⚠️ Erro ao carregar o modelo: {e}. Treinando do zero...")
            treinar_modelo()
    else:
        print("⚠️ Nenhum modelo encontrado, treinando do zero...")
        treinar_modelo()

# 🚀 Função de treinamento otimizada com validação cruzada
def treinar_modelo():
    global model
    while True:
        cursor.execute("SELECT temperatura, umidade, vento, enchente FROM clima")
        dados = cursor.fetchall()
        if len(dados) < 10:
            print("Aguardando mais dados para treino...")
            time.sleep(3600)
            continue

        np.random.shuffle(dados)
        split = int(0.8 * len(dados))
        treino, teste = dados[:split], dados[split:]

        X_treino = np.array([d[:3] for d in treino]).reshape(-1, 1, 3)
        y_treino = np.array([d[3] for d in treino]).reshape(-1, 1)
        X_teste = np.array([d[:3] for d in teste]).reshape(-1, 1, 3)
        y_teste = np.array([d[3] for d in teste]).reshape(-1, 1)
        
        X_tensor = torch.tensor(X_treino, dtype=torch.float32)
        y_tensor = torch.tensor(y_treino, dtype=torch.float32)
        X_teste_tensor = torch.tensor(X_teste, dtype=torch.float32)
        y_teste_tensor = torch.tensor(y_teste, dtype=torch.float32)
        
        criterion = nn.BCELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

        for _ in range(200):
            optimizer.zero_grad()
            outputs = model(X_tensor)
            loss = criterion(outputs, y_tensor)
            loss.backward()
            optimizer.step()

        with torch.no_grad():
            pred = model(X_teste_tensor).round()
            acuracia = (pred == y_teste_tensor).float().mean().item()
            print(f"✅ Acurácia do modelo: {acuracia * 100:.2f}%")

        torch.save(model.state_dict(), "modelo_lstm.pth")
        print("✅ Modelo treinado e salvo!")
        time.sleep(3600)

# 🚀 Criar API FastAPI com segurança
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Apenas React local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/predict/")
def predict_flood(lat: float, lon: float):
    try:
        features = get_weather_data(lat, lon)
        if features is None:
            raise HTTPException(status_code=500, detail="Erro ao obter dados climáticos")
        
        features = np.array(features).reshape(1, 1, -1)
        prediction = model(torch.tensor(features, dtype=torch.float32)).item()
        return {"enchente": prediction > 0.5, "probabilidade": round(prediction, 4)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    carregar_modelo()
    Thread(target=treinar_modelo).start()
    uvicorn.run(app, host="0.0.0.0", port=8000)

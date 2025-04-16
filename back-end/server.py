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
from sklearn.ensemble import RandomForestClassifier
import joblib

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

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

# Função para iniciar o treinamento do modelo Random Forest
def iniciar_treinamento_rf():
    treinar_modelo_rf()

def get_weather_data(lat, lon, tentativas=3):
    url = f"http://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={lat},{lon}"
    for _ in range(tentativas):
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            return [data["current"]["temp_c"], data["current"]["humidity"], data["current"]["wind_kph"]]
        except Exception as e:
            print(f"Erro ao buscar dados climáticos: {e}")
            time.sleep(2)
    return None

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
            print("Modelo carregado com sucesso!")
        except Exception as e:
            print(f"Erro ao carregar o modelo: {e}")
    else:
        print("⚠️ Nenhum modelo salvo encontrado.")

def treinar_modelo():
    global model
    while True:
        cursor.execute("SELECT temperatura, umidade, vento, enchente FROM clima")
        dados = cursor.fetchall()
        if len(dados) < 10:
            print("⏳ Aguardando mais dados para treino...")
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
            print(f"Acurácia do modelo: {acuracia * 100:.2f}%")

        torch.save(model.state_dict(), "modelo_lstm.pth")
        print("Modelo treinado e salvo!")
        time.sleep(3600)

# Inicializar o modelo Random Forest
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)

def treinar_modelo_rf():
    global rf_model
    while True:
        cursor.execute("SELECT temperatura, umidade, vento, enchente FROM clima")
        dados = cursor.fetchall()
        if len(dados) < 10:
            print("⏳ Aguardando mais dados para treino...")
            time.sleep(3600)
            continue

        np.random.shuffle(dados)
        split = int(0.8 * len(dados))
        treino, teste = dados[:split], dados[split:]

        X_treino = np.array([d[:3] for d in treino])
        y_treino = np.array([d[3] for d in treino])

        X_teste = np.array([d[:3] for d in teste])
        y_teste = np.array([d[3] for d in teste])

        # Treinando o modelo Random Forest
        rf_model.fit(X_treino, y_treino)

        # Avaliar o modelo
        acuracia = rf_model.score(X_teste, y_teste)
        print(f"Acurácia do modelo Random Forest: {acuracia * 100:.2f}%")

        # Salvando o modelo
        joblib.dump(rf_model, 'modelo_rf.pkl')
        print("Modelo Random Forest treinado e salvo!")
        time.sleep(3600)

# Carregar o modelo Random Forest salvo
def carregar_modelo_rf():
    global rf_model
    if os.path.exists('modelo_rf.pkl'):
        try:
            rf_model = joblib.load('modelo_rf.pkl')
            print("Modelo Random Forest carregado com sucesso!")
        except Exception as e:
            print(f"Erro ao carregar o modelo: {e}")
    else:
        print("⚠️ Nenhum modelo Random Forest salvo encontrado.")

def predict_ensemble(lat, lon):
    try:
        # Verificar se o modelo foi treinado
        if rf_model is None:
            raise HTTPException(status_code=500, detail="Modelo Random Forest não foi treinado ainda.")

        features = get_weather_data(lat, lon)
        if features is None:
            raise HTTPException(status_code=500, detail="Erro ao obter dados climáticos")

        # Previsão com o modelo LSTM
        input_tensor = torch.tensor(np.array(features).reshape(1, 1, -1), dtype=torch.float32)
        with torch.no_grad():
            lstm_prediction = model(input_tensor).item()

        # Previsão com o modelo Random Forest
        rf_prediction = rf_model.predict([features])[0]

        # Média ponderada das previsões
        final_prediction = 0.6 * lstm_prediction + 0.4 * rf_prediction

        salvar_dados(features[0], features[1], features[2], int(final_prediction > 0.5))

        return {"enchente": bool(final_prediction > 0.5), "probabilidade": round(final_prediction, 4)}

    except Exception as e:
        print(f"Erro na previsão: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na previsão: {str(e)}")
    
    # Treinar o modelo Random Forest em um thread separado
thread_rf = Thread(target=iniciar_treinamento_rf, daemon=True)
thread_rf.start()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"mensagem": "API de previsão de enchentes ativa!"}

@app.get("/predict/")
def predict_flood(lat: float, lon: float):
    try:
        return predict_ensemble(lat, lon)
    except Exception as e:
        print(f"Erro detalhado: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na previsão: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
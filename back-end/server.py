from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Tenta carregar um modelo salvo, senão cria um novo
try:
    model = joblib.load("flood_model.pkl")
except:
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    # Inicializa com um conjunto de dados fictício para não começar do zero
    X_train = np.array([[10, 80], [50, 95], [5, 60], [80, 98], [0, 40]])  # [precipitação, umidade]
    y_train = np.array([0, 1, 0, 1, 0])  # 0 = Baixo Risco, 1 = Alto Risco
    model.fit(X_train, y_train)
    joblib.dump(model, "flood_model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        precip = data["precip_mm"]
        humidity = data["humidity"]

        # Verificação de valores inválidos
        if precip is None or humidity is None:
            raise ValueError("Precipitação e umidade são obrigatórios.")

        prediction = model.predict([[precip, humidity]])[0]
        return jsonify({"flood_risk": int(prediction)})

    except KeyError as e:
        return jsonify({"error": f"Campo ausente: {str(e)}"})
    except ValueError as e:
        return jsonify({"error": f"Erro nos dados: {str(e)}"})
    except Exception as e:
        return jsonify({"error": f"Erro inesperado: {str(e)}"})

@app.route("/train", methods=["POST"])
def train():
    try:
        data = request.json
        precip = data["precip_mm"]
        humidity = data["humidity"]
        flood_risk = data["flood_risk"]  # O risco de enchente real informado pelo usuário

        # Adiciona os novos dados ao modelo e re-treina
        X_new = np.array([[precip, humidity]])
        y_new = np.array([flood_risk])

        # Carrega dados antigos e adiciona novos
        X_old = np.array([[10, 80], [50, 95], [5, 60], [80, 98], [0, 40]])
        y_old = np.array([0, 1, 0, 1, 0])

        X_train = np.vstack((X_old, X_new))
        y_train = np.hstack((y_old, y_new))

        model.fit(X_train, y_train)
        joblib.dump(model, "flood_model.pkl")

        return jsonify({"message": "Modelo atualizado com sucesso!"})

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)

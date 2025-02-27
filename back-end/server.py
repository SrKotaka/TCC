from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)
DATA_FILE = "flood_data.csv"
data = pd.read_csv(DATA_FILE)
print(data)


# Tenta carregar um modelo salvo, senão cria um novo
try:
    # Tentar carregar o modelo salvo
    model = joblib.load("flood_model.pkl")
except FileNotFoundError:
    print("Modelo não encontrado. Criando um novo...")
    # Se o modelo não existir, cria um novo
    model = RandomForestClassifier(n_estimators=100, random_state=42)

    # Verificar se o CSV existe e contém dados
    if os.path.exists(DATA_FILE) and os.stat(DATA_FILE).st_size > 0:
        data = pd.read_csv(DATA_FILE)

        if not data.empty and "precip_mm" in data.columns and "humidity" in data.columns:
            X_train = data[["precip_mm", "humidity"]].values
            y_train = data["flood_risk"].values
            model.fit(X_train, y_train)

            # Salvar o modelo treinado
            joblib.dump(model, "flood_model.pkl")
        else:
            print("⚠️ Aviso: CSV está vazio ou com formato incorreto.")
    else:
        print("⚠️ Aviso: O arquivo de dados não existe ou está vazio.")



# Se o arquivo não existir, cria com cabeçalho
if not os.path.exists(DATA_FILE):
    pd.DataFrame(columns=["precip_mm", "humidity", "flood_risk"]).to_csv(DATA_FILE, index=False)

@app.route("/train", methods=["POST"])
def train():
    try:
        data = request.json
        precip = data["precip_mm"]
        humidity = data["humidity"]
        flood_risk = data["flood_risk"]

        # Salvar os novos dados no arquivo CSV
        df = pd.DataFrame([[precip, humidity, flood_risk]], columns=["precip_mm", "humidity", "flood_risk"])
        df.to_csv(DATA_FILE, mode="a", header=False, index=False)

        # Recarregar todos os dados para re-treinar o modelo
        data = pd.read_csv(DATA_FILE)
        X_train = data[["precip_mm", "humidity"]].values
        y_train = data["flood_risk"].values

        # Exclui modelo antigo para forçar um novo treinamento
        if os.path.exists("flood_model.pkl"):
            os.remove("flood_model.pkl")

        model.fit(X_train, y_train)
        joblib.dump(model, "flood_model.pkl")

        return jsonify({"message": "Modelo atualizado com sucesso!"})

    except Exception as e:
        return jsonify({"error": str(e)})



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

@app.route("/", methods=["GET"])
def home():
    return "API de previsão de enchentes está funcionando!"

if __name__ == "__main__":
    app.run(debug=True)

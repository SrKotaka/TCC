# app.py
from flask import Flask, request, jsonify
import joblib

app = Flask(__name__)

# Carregar o modelo treinado
model = joblib.load("flood_risk_model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    # Receber os dados do frontend
    data = request.json
    precip_mm = data["precip_mm"]
    humidity = data["humidity"]

    # Fazer a previsão
    prediction = model.predict([[precip_mm, humidity]])

    # Retornar o resultado
    return jsonify({"flood_risk": int(prediction[0])})

if __name__ == "__main__":
    app.run(debug=True)
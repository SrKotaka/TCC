from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permite requisições de outros domínios (útil para desenvolvimento)

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        # Resposta para as requisições OPTIONS
        return jsonify({'message': 'CORS preflight response'}), 200

    # Quando o método for POST
    data = request.get_json()
    precip_mm = data.get("precip_mm", 0)
    humidity = data.get("humidity", 0)

    # Lógica simples para previsão (substitua pelo seu modelo de ML)
    if precip_mm > 5 and humidity > 80:
        flood_risk = 1  # Alto risco
    else:
        flood_risk = 0  # Baixo risco

    return jsonify({"flood_risk": flood_risk})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

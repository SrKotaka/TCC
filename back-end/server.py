from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight response'}), 200

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Dados ausentes"}), 400
        
        precip_mm = float(data.get("precip_mm", 0))
        humidity = float(data.get("humidity", 0))

        flood_risk = 1 if precip_mm > 5 and humidity > 80 else 0

        return jsonify({"flood_risk": flood_risk})
    
    except Exception as e:
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(port=port, debug=True)

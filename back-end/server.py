from flask import Flask, request, jsonify
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from flask_cors import CORS
import os


app = Flask(__name__)
CORS(app)
DATA_FILE = "flood_data.csv"

# Verifica se o arquivo existe e contém dados antes de ler
if os.path.exists(DATA_FILE) and os.stat(DATA_FILE).st_size > 0:
    data = pd.read_csv(DATA_FILE)
    if "precip_mm" not in data.columns or "humidity" not in data.columns or "flood_risk" not in data.columns:
        print("⚠️ Aviso: O arquivo CSV não possui todas as colunas necessárias.")
        data = None  # Evita erros ao tentar acessar colunas inexistentes
else:
    print("⚠️ Aviso: O arquivo de dados não existe ou está vazio.")
    data = None


# Tenta carregar um modelo salvo, senão cria um novo
try:
    model = joblib.load("flood_model.pkl")
except FileNotFoundError:
    print("Modelo não encontrado. Criando um novo...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)

    if data is not None:  # Só treina se os dados estiverem corretos
        X_train = data[["precip_mm", "humidity"]].values
        y_train = data["flood_risk"].values
        model.fit(X_train, y_train)
        joblib.dump(model, "flood_model.pkl")
    else:
        print("⚠️ Aviso: Não há dados válidos para treinar o modelo.")

# Criar o CSV somente se não existir
if not os.path.exists(DATA_FILE):
    pd.DataFrame(columns=["precip_mm", "humidity", "flood_risk"]).to_csv(DATA_FILE, index=False)
    print("📄 Arquivo flood_data.csv criado.")



# Se o arquivo não existir, cria com cabeçalho
if not os.path.exists(DATA_FILE):
    pd.DataFrame(columns=["precip_mm", "humidity", "flood_risk"]).to_csv(DATA_FILE, index=False)

@app.route("/train", methods=["POST"])
def train():
    try:
        data_request = request.json
        city = data_request["city"]
        precip = data_request["precip_mm"]
        humidity = data_request["humidity"]
        flood_risk = data_request["flood_risk"]

        # Salvar os novos dados no arquivo CSV, incluindo o nome da cidade
        df = pd.DataFrame([[city, precip, humidity, flood_risk]], columns=["city", "precip_mm", "humidity", "flood_risk"])
        df.to_csv(DATA_FILE, mode="a", header=False, index=False)

        # Recarregar todos os dados para re-treinar o modelo
        data = pd.read_csv(DATA_FILE)
        X_train = data[["precip_mm", "humidity"]].values
        y_train = data["flood_risk"].values

        # Treinar o modelo (sobrescrevendo o antigo)
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


@app.route("/high_risk_cities", methods=["GET"])
def high_risk_cities():
    try:
        data = pd.read_csv(DATA_FILE)
        
        # Verifica se a coluna "city" existe no dataset
        if "city" not in data.columns:
            return jsonify({"error": "O dataset não contém informações de cidades."})
        
        # Filtrar cidades com risco alto
        high_risk = data[data["flood_risk"] == 1]["city"].unique().tolist()
        return jsonify({"high_risk_cities": high_risk})
    
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/", methods=["GET"])
def home():
    return "API de previsão de enchentes está funcionando!"

if __name__ == "__main__":
    app.run(debug=True)

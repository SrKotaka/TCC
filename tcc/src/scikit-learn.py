# modelo_ml.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

# Exemplo de dados históricos (substitua por dados reais)
data = {
    "precip_mm": [10, 5, 20, 50, 100],  # Chuva em mm
    "humidity": [60, 70, 80, 90, 95],    # Umidade em %
    "flood_risk": [0, 0, 1, 1, 1]        # Risco de enchente (0 = Não, 1 = Sim)
}

# Criar um DataFrame
df = pd.DataFrame(data)

# Separar features (X) e target (y)
X = df[["precip_mm", "humidity"]]
y = df["flood_risk"]

# Treinar o modelo
model = RandomForestClassifier()
model.fit(X, y)

# Salvar o modelo treinado
joblib.dump(model, "flood_risk_model.pkl")
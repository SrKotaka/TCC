import numpy as np, time, joblib, sqlite3
from core.models import rf_model

def treinar_modelo_rf():
    conn_local = sqlite3.connect("dados_climaticos.db")
    cursor_local = conn_local.cursor()
    while True:
        cursor_local.execute("SELECT temperatura, umidade, vento, enchente FROM clima")
        dados = cursor_local.fetchall()
        if len(dados) < 10:
            time.sleep(3600)
            continue
        np.random.shuffle(dados)
        split = int(0.8 * len(dados))
        X = np.array([d[:3] for d in dados])
        y = np.array([d[3] for d in dados])
        rf_model.fit(X[:split], y[:split])
        joblib.dump(rf_model, "modelo_rf.pkl")
        time.sleep(3600)

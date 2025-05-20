import sqlite3

conn = sqlite3.connect("dados_climaticos.db", check_same_thread=False)
cursor = conn.cursor()
cursor.execute("""
    CREATE TABLE IF NOT EXISTS clima (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temperatura REAL,
        umidade REAL,
        vento REAL,
        enchente INTEGER, -- Pode ser a classe predita
        predicted_probability REAL, -- Probabilidade predita
        latitude REAL, -- Latitude da predição
        longitude REAL, -- Longitude da predição
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP -- Data/hora da predição
    )
""")
conn.commit()

def salvar_dados(temperatura, umidade, vento, enchente_predita_classe, probabilidade_predita, lat, lon):
    cursor.execute("""
        INSERT INTO clima (temperatura, umidade, vento, enchente, predicted_probability, latitude, longitude, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (temperatura, umidade, vento, enchente_predita_classe, probabilidade_predita, lat, lon))
    conn.commit()

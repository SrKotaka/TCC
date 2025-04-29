import sqlite3

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
    cursor.execute("INSERT INTO clima (temperatura, umidade, vento, enchente) VALUES (?, ?, ?, ?)",
                   (temperatura, umidade, vento, enchente))
    conn.commit()

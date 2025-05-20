# main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from apscheduler.schedulers.background import BackgroundScheduler
from sklearn.exceptions import NotFittedError # Adicione este import

from core.training import iniciar_threads_de_treinamento
from core.models import carregar_modelos
from services.ensemble import predict_ensemble
from core.evaluation import run_ensemble_evaluation # Importe sua função
from core.database import cursor as db_cursor

# Função para o job do scheduler
def scheduled_evaluation_job():
    print("Scheduler: Iniciando a tarefa de avaliação do ensemble.")
    try:
        # Adicionado para garantir que os modelos sejam recarregados antes de cada avaliação agendada
        print("Scheduler: Tentando recarregar modelos antes da avaliação...")
        from core.models import carregar_modelos # Import local para garantir que está pegando a função certa
        carregar_modelos() # Recarrega os modelos para pegar as versões mais recentes
        
        from core.evaluation import run_ensemble_evaluation # Import local
        run_ensemble_evaluation()
    except NotFittedError as nfe:
        print(f"INFO [Scheduler]: Avaliação adiada. Um ou mais modelos ainda não estão treinados/prontos: {nfe}")
    except Exception as e:
        print(f"ERRO [Scheduler]: Erro durante a avaliação agendada do ensemble: {e}")

# Variável global para o scheduler para poder ser encerrada no shutdown
scheduler = BackgroundScheduler(timezone="America/Sao_Paulo") # Use seu timezone

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Código de Startup
    print("Lifespan: Iniciando aplicação...")
    carregar_modelos()
    iniciar_threads_de_treinamento()
    
    global scheduler
    # Defina o intervalo desejado. Ex: a cada 1 hora.
    scheduler.add_job(scheduled_evaluation_job, 'interval', hours=1, misfire_grace_time=300)
    if not scheduler.running:
        scheduler.start()
        print("Lifespan: Scheduler de avaliação do ensemble configurado e iniciado.")
    
    # Executar a primeira avaliação no startup
    print("Lifespan: Executando a primeira avaliação do ensemble no startup...")
    try:
        scheduled_evaluation_job()
    except Exception as e:
        print(f"Lifespan: Erro ao executar a primeira avaliação do ensemble no startup: {e}")
        
    yield  # A aplicação está rodando entre o yield

    # Código de Shutdown
    print("Lifespan: Encerrando aplicação...")
    if scheduler.running:
        scheduler.shutdown()
        print("Lifespan: Scheduler de avaliação encerrado.")

app = FastAPI(lifespan=lifespan) # Aplica o lifespan

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"mensagem": "API de previsão de enchentes ativa!"}

@app.get("/evaluate/")
def get_ensemble_evaluation():
    try:
        metrics = run_ensemble_evaluation()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao executar avaliação: {str(e)}")
    
@app.get("/predict/")
def predict_flood(lat: float, lon: float):
    try:
        return predict_ensemble(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na previsão: {str(e)}")
    
@app.get("/predict/history/")
def get_prediction_history(lat: float, lon: float, limit: int = 30): # limite de pontos
    # Idealmente, adicionar uma pequena tolerância para lat/lon se necessário
    db_cursor.execute("""
        SELECT timestamp, predicted_probability
        FROM clima
        WHERE latitude = ? AND longitude = ?
        ORDER BY timestamp DESC
        LIMIT ?
    """, (lat, lon, limit))
    history = db_cursor.fetchall()
    # Inverter para ordem cronológica para o gráfico
    return [{"timestamp": row[0], "probability": row[1]} for row in reversed(history)]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
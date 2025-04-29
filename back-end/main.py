from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from core.training import iniciar_threads_de_treinamento
from core.models import carregar_modelos
from services.ensemble import predict_ensemble

# Iniciar modelos e threads de treinamento
carregar_modelos()
iniciar_threads_de_treinamento()

app = FastAPI()
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

@app.get("/predict/")
def predict_flood(lat: float, lon: float):
    try:
        return predict_ensemble(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na previsão: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

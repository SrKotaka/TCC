import threading
from core.treino_lstm import treinar_modelo_lstm
from core.treino_rf import treinar_modelo_rf
from core.treino_xgb import treinar_modelo_xgb

def iniciar_threads_de_treinamento():
    threading.Thread(target=treinar_modelo_lstm, daemon=True).start()
    threading.Thread(target=treinar_modelo_rf, daemon=True).start()
    threading.Thread(target=treinar_modelo_xgb, daemon=True).start()

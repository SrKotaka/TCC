import torch, os, joblib, xgboost as xgb
from sklearn.ensemble import RandomForestClassifier
from core.model_lstm import LSTMModel

model = LSTMModel()
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
xgb_model = xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss')

def carregar_modelos():
    global model, rf_model, xgb_model
    if os.path.exists("modelo_lstm.pth"):
        model.load_state_dict(torch.load("modelo_lstm.pth"))
        model.eval()
    if os.path.exists("modelo_rf.pkl"):
        rf_model = joblib.load("modelo_rf.pkl")
    if os.path.exists("modelo_xgb.pkl"):
        xgb_model = joblib.load("modelo_xgb.pkl")

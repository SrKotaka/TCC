import numpy as np, time, torch
from core.models import model
from core.database import cursor
from torch import nn

def treinar_modelo_lstm():
    while True:
        cursor.execute("SELECT temperatura, umidade, vento, enchente FROM clima")
        dados = cursor.fetchall()
        if len(dados) < 10:
            time.sleep(3600)
            continue
        np.random.shuffle(dados)
        split = int(0.8 * len(dados))
        treino, teste = dados[:split], dados[split:]
        X_treino = torch.tensor(np.array([d[:3] for d in treino]).reshape(-1, 1, 3), dtype=torch.float32)
        y_treino = torch.tensor(np.array([d[3] for d in treino]).reshape(-1, 1), dtype=torch.float32)
        X_teste = torch.tensor(np.array([d[:3] for d in teste]).reshape(-1, 1, 3), dtype=torch.float32)
        y_teste = torch.tensor(np.array([d[3] for d in teste]).reshape(-1, 1), dtype=torch.float32)
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
        criterion = nn.BCELoss()
        for _ in range(200):
            optimizer.zero_grad()
            loss = criterion(model(X_treino), y_treino)
            loss.backward()
            optimizer.step()
        with torch.no_grad():
            y_pred = model(X_teste)
            y_pred_classes = (y_pred > 0.5).float()
            accuracy = (y_pred_classes == y_teste).float().mean().item()
            print(f"Acurácia no conjunto de teste: {accuracy:.4f}")
        torch.save(model.state_dict(), "modelo_lstm.pth")
        time.sleep(3600)

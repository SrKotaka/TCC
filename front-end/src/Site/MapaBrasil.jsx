import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import municipios from '../municipios.json';
import './MapaBrasil.css'
import axios from 'axios';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const API_URL = 'http://localhost:8000/predict/';
const EVALUATE_URL = 'http://localhost:8000/evaluate/';

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const MapaBrasil = () => {
  const [dados, setDados] = useState({});
  const [municipioSelecionado, setMunicipioSelecionado] = useState(null);
  const [evaluationMetrics, setEvaluationMetrics] = useState(null);
  const pendingRequests = useRef(new Set());

  const fetchData = async (lat, lon, municipioNome) => {

    if (dados[municipioNome] && !pendingRequests.current.has(municipioNome)) {
      setMunicipioSelecionado({ nome: municipioNome, carregando: false });
      return;
    }
    
    setMunicipioSelecionado({ nome: municipioNome, carregando: true });
    if (pendingRequests.current.has(municipioNome)) return;
    pendingRequests.current.add(municipioNome);
  
    try {
      const { data } = await axios.get(`${API_URL}?lat=${lat}&lon=${lon}`);
      if (data.erro) throw new Error(data.erro);
      setDados((prev) => ({ ...prev, [municipioNome]: data }));
    } catch (error) {
      console.error(`Erro ao buscar dados para ${municipioNome}:`, error.message);
      setDados((prev) => ({ ...prev, [municipioNome]: { erro: true } }));
    } finally {
      pendingRequests.current.delete(municipioNome);
      setMunicipioSelecionado({ nome: municipioNome, carregando: false });
    }
  };

  const fetchEvaluationData = async () => {
    try {
      const response = await axios.get(EVALUATE_URL);
      setEvaluationMetrics(response.data);
      console.log("Dados de avaliação recebidos:", response.data);
    } catch (error) {
      console.error("Erro ao buscar dados de avaliação:", error);
      setEvaluationMetrics({ erro: true });
    }
  };

  useEffect(() => {
    // Buscar dados de avaliação periodicamente (ex: a cada 5 minutos)
    fetchEvaluationData();
    const intervalId = setInterval(fetchEvaluationData, 300000); // 5 minutos
    return () => clearInterval(intervalId); // Limpar intervalo ao desmontar o componente
  }, []);

  const fecharSidebar = () => setMunicipioSelecionado(null);

  const chartData = evaluationMetrics && !evaluationMetrics.erro ? {
    labels: ['MSE', 'MCC', 'Acurácia', 'AUC-ROC'],
    datasets: [
      {
        label: 'Métricas de Avaliação do Ensemble',
        data: [
          //O que avaliamos aqui: Esta métrica mede o erro quadrático médio entre as probabilidades de enchente 
          // que o nosso modelo prevê (um valor entre 0 e 1) e o resultado real (onde 'enchente' é 1 e 'não enchente' é 0).
          evaluationMetrics.mse,

          //O que avaliamos aqui: O MCC é um coeficiente de correlação que resume a qualidade da classificação binária 
          // (enchente/não enchente) em um único valor, que varia de -1 a +1. Ele considera todos os quatro componentes
          //  da matriz de confusão: verdadeiros positivos (enchentes previstas corretamente), verdadeiros negativos 
          // (não enchentes previstas corretamente), falsos positivos (alarmes falsos de enchente) e falsos negativos (enchentes não detectadas).
          evaluationMetrics.mcc,

          //O que avaliamos aqui: Esta é a métrica mais intuitiva. Ela mede a proporção de todas as previsões que o modelo acertou, 
          // ou seja, o percentual de dias em que o modelo previu corretamente se haveria ou não uma enchente.
          evaluationMetrics.accuracy,

          //O que avaliamos aqui: A AUC-ROC mede a capacidade geral do modelo de distinguir entre um dia com enchente e um dia sem enchente.
          //  A curva ROC é construída plotando a taxa de verdadeiros positivos (quantas enchentes o modelo detectou corretamente) 
          // contra a taxa de falsos positivos (quantas vezes o modelo deu um alarme falso de enchente) para todos os possíveis 
          // limiares de decisão da probabilidade. A AUC é a área sob essa curva.
          typeof evaluationMetrics.auc_roc === 'number' ? evaluationMetrics.auc_roc : null,
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  } : null;

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <>
      <MapContainer center={[-14.235, -51.9253]} zoom={4} style={{ height: '100vh', width: '100vw' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap contributors' />
        <MarkerClusterGroup>
          {municipios.map((municipio) => (
            <Marker
              key={municipio.nome}
              position={[municipio.lat, municipio.lon]}
              icon={defaultIcon}
              eventHandlers={{
                click: () => fetchData(municipio.lat, municipio.lon, municipio.nome),
              }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {municipioSelecionado && (
        <div className="sidebar">
          <button className="sidebar-close" onClick={fecharSidebar}>X</button>
          <h2>{municipioSelecionado.nome}</h2>
          {municipioSelecionado.carregando ? (
            <p>Carregando dados...</p>
          ) : dados[municipioSelecionado.nome]?.erro ? (
            <p style={{ color: 'red' }}>Erro ao obter dados.</p>
          ) : (
            <>
              <p><strong>Probabilidade de enchente:</strong> {(dados[municipioSelecionado.nome].probabilidade * 100).toFixed(2)}%</p>
              <Link to="/Dicas">O que fazer em caso de enchente?</Link>
            </>
          )}
        </div>
      )}

      <div className="evaluation-panel">
        <h3>Avaliação do Modelo Ensemble</h3>
        {evaluationMetrics === null ? (
          <p>Carregando métricas de avaliação...</p>
        ) : evaluationMetrics.erro ? (
          <p style={{ color: 'red' }}>Erro ao carregar métricas de avaliação.</p>
        ) : (
          <>
            <p><strong>MSE:</strong> {evaluationMetrics.mse?.toFixed(4)}</p>
            <p><strong>MCC:</strong> {evaluationMetrics.mcc?.toFixed(4)}</p>
            <p><strong>Acurácia:</strong> {evaluationMetrics.accuracy?.toFixed(4)}</p>
            <p><strong>AUC-ROC:</strong> {typeof evaluationMetrics.auc_roc === 'number' ? evaluationMetrics.auc_roc?.toFixed(4) : evaluationMetrics.auc_roc}</p>
            {chartData && (
              <Bar data={chartData} options={chartOptions} />
            )}
          </>
        )}
      </div>
    </>
  );
};

export default MapaBrasil;

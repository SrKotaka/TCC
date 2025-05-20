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
// Importe o Line chart do chart.js
import { Bar, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const API_URL = 'http://localhost:8000/predict/';
const EVALUATE_URL = 'http://localhost:8000/evaluate/';
// Endpoint hipotético para o histórico de predições
const HISTORY_API_URL = 'http://localhost:8000/predict/history/';


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
  
  // Estado para os dados do gráfico de série temporal
  const [timeSeriesChartData, setTimeSeriesChartData] = useState(null);
  // Estado para o carregamento do gráfico de série temporal
  const [isTimeSeriesLoading, setIsTimeSeriesLoading] = useState(false);

  const pendingRequests = useRef(new Set());
  // Ref para controlar a requisição da série temporal (evitar múltiplas)
  const currentTimeSeriesRequestKey = useRef(null);


  // Função para buscar a predição ATUAL
  const fetchCurrentPrediction = async (lat, lon, municipioNome) => {
    const requestKey = `${lat}-${lon}`;
    if (dados[municipioNome] && !dados[municipioNome].erro && !pendingRequests.current.has(requestKey)) {
      setMunicipioSelecionado({ nome: municipioNome, carregando: false }); // Já tem dados, só atualiza seleção
      return;
    }

    if (pendingRequests.current.has(requestKey)) return; // Requisição em andamento

    pendingRequests.current.add(requestKey);
    // Atualiza o estado do município selecionado para mostrar carregamento da predição atual
    setMunicipioSelecionado({ nome: municipioNome, carregando: true });

    try {
      const { data } = await axios.get(`${API_URL}?lat=${lat}&lon=${lon}`);
      if (data.erro) throw new Error(data.erro);
      setDados((prev) => ({ ...prev, [municipioNome]: data }));
    } catch (error) {
      console.error(`Erro ao buscar dados atuais para ${municipioNome}:`, error.message);
      setDados((prev) => ({ ...prev, [municipioNome]: { erro: true } }));
    } finally {
      pendingRequests.current.delete(requestKey);
      // Verifica se o município que terminou de carregar ainda é o selecionado
      if (currentTimeSeriesRequestKey.current === `${lat}-${lon}-${municipioNome}` || (municipioSelecionado && municipioSelecionado.nome === municipioNome)) {
         setMunicipioSelecionado(ms => ms && ms.nome === municipioNome ? { ...ms, carregando: false } : ms);
      }
    }
  };

  // Nova função para buscar dados de SÉRIE TEMPORAL
  const fetchTimeSeriesForMunicipio = async (lat, lon, municipioNome) => {
    const requestKey = `${lat}-${lon}-${municipioNome}`; // Chave única para a requisição
    currentTimeSeriesRequestKey.current = requestKey; // Armazena a chave da requisição atual

    setIsTimeSeriesLoading(true);
    setTimeSeriesChartData(null); // Limpa dados antigos

    try {
      const response = await axios.get(`${HISTORY_API_URL}?lat=${lat}&lon=${lon}&limit=30`); // Pega os últimos 30 pontos

      // Verifica se a resposta ainda é para o município selecionado
      if (currentTimeSeriesRequestKey.current === requestKey) {
        if (response.data && response.data.length > 0) {
          const labels = response.data.map(d => new Date(d.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
          const probabilities = response.data.map(d => d.probability);

          setTimeSeriesChartData({
            labels: labels, // Já vem em ordem cronológica do backend
            datasets: [
              {
                label: `Probabilidade Histórica`,
                data: probabilities,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
              },
            ],
          });
        } else {
          setTimeSeriesChartData({ noData: true }); // Indica que não há dados
        }
      }
    } catch (error) {
      console.error(`Erro ao buscar série temporal para ${municipioNome}:`, error);
      if (currentTimeSeriesRequestKey.current === requestKey) {
        setTimeSeriesChartData({ erro: true }); // Indica erro
      }
    } finally {
      if (currentTimeSeriesRequestKey.current === requestKey) {
        setIsTimeSeriesLoading(false);
      }
    }
  };
  
  // Handler para o clique no marcador
  const handleMarkerClick = (lat, lon, municipioNome) => {
    setMunicipioSelecionado({ nome: municipioNome, carregando: true }); // Inicia carregando para dados atuais
    fetchCurrentPrediction(lat, lon, municipioNome);
    fetchTimeSeriesForMunicipio(lat, lon, municipioNome);
  };


  const fetchEvaluationData = async () => {
    try {
      const response = await axios.get(EVALUATE_URL);
      setEvaluationMetrics(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados de avaliação:", error);
      setEvaluationMetrics({ erro: true });
    }
  };

  useEffect(() => {
    fetchEvaluationData();
    const intervalId = setInterval(fetchEvaluationData, 300000); 
    return () => clearInterval(intervalId); 
  }, []);

  const fecharSidebar = () => {
    setMunicipioSelecionado(null);
    setTimeSeriesChartData(null); // Limpa dados do gráfico
    setIsTimeSeriesLoading(false);
    currentTimeSeriesRequestKey.current = null; // Limpa a ref da requisição
  };

  // Dados para o gráfico de avaliação (Bar)
  const evaluationChartData = evaluationMetrics && !evaluationMetrics.erro ? {
    labels: ['MSE', 'MCC', 'Acurácia', 'AUC-ROC'],
    datasets: [
      {
        label: 'Métricas de Avaliação do Ensemble',
        data: [
          evaluationMetrics.mse,
          evaluationMetrics.mcc,
          evaluationMetrics.accuracy,
          typeof evaluationMetrics.auc_roc === 'number' ? evaluationMetrics.auc_roc : null,
        ].map(val => val !== null && val !== undefined ? parseFloat(val.toFixed(4)) : 0), // Garante que são números e formata
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  } : null;

  const evaluationChartOptions = {
    scales: { y: { beginAtZero: true, suggestedMax: 1 } }, // Sugere max 1 para métricas como acurácia
    responsive: true,
    maintainAspectRatio: false,
  };

  // Opções para o gráfico de série temporal (Line)
  const timeSeriesChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 1, // Probabilidade vai de 0 a 1
        title: { display: true, text: 'Probabilidade' }
      },
      x: {
        title: { display: true, text: 'Data (DD/MM)' }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'top'} }
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
                click: () => handleMarkerClick(municipio.lat, municipio.lon, municipio.nome),
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
            <p>Carregando dados atuais...</p>
          ) : dados[municipioSelecionado.nome]?.erro ? (
            <p style={{ color: 'red' }}>Erro ao obter dados atuais.</p>
          ) : dados[municipioSelecionado.nome] ? (
            <>
              <p><strong>Probabilidade de enchente (atual):</strong> {(dados[municipioSelecionado.nome].probabilidade * 100).toFixed(2)}%</p>
              <Link to="/Dicas">O que fazer em caso de enchente?</Link>

              {/* Seção do Gráfico de Série Temporal */}
              <div className="time-series-chart-container" style={{ marginTop: '20px', height: '200px', width:'100%'}}>
                <h4>Histórico de Probabilidade</h4>
                {isTimeSeriesLoading ? (
                  <p>Carregando histórico...</p>
                ) : timeSeriesChartData?.erro ? (
                  <p style={{ color: 'red' }}>Erro ao carregar histórico.</p>
                ) : timeSeriesChartData?.noData ? (
                  <p>Não há dados históricos para este município.</p>
                ) : timeSeriesChartData ? (
                  <Line data={timeSeriesChartData} options={timeSeriesChartOptions} />
                ) : (
                  <p>Não há dados históricos disponíveis ou ocorreu um erro.</p> // Fallback genérico
                )}
              </div>
            </>
          ) : null /* Não mostrar nada se dados[municipioSelecionado.nome] não existir e não estiver carregando */}
        </div>
      )}

      <div className="evaluation-panel" style={{ height: '300px', width: '400px' }}> {/* Ajuste o tamanho conforme necessário */}
        <h3>Avaliação do Modelo Ensemble</h3>
        {evaluationMetrics === null ? (
          <p>Carregando métricas de avaliação...</p>
        ) : evaluationMetrics.erro ? (
          <p style={{ color: 'red' }}>Erro ao carregar métricas.</p>
        ) : (
          <>
            {/* As métricas podem ser exibidas como texto ou apenas no gráfico */}
            {evaluationChartData && (
              <div style={{ height: '250px' }}> {/* Container para o gráfico de avaliação */}
                <Bar data={evaluationChartData} options={evaluationChartOptions} />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default MapaBrasil;
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import municipios from '../municipios.json';
import './MapaBrasil.css'
import { useState, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:8000/predict/';

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const MapaBrasil = () => {
  const [dados, setDados] = useState({});
  const [municipioSelecionado, setMunicipioSelecionado] = useState(null);
  const pendingRequests = useRef(new Set());

  const fetchData = async (lat, lon, municipioNome) => {
    setMunicipioSelecionado({ nome: municipioNome, carregando: true }); // ativa a barra enquanto carrega
    if (dados[municipioNome] || pendingRequests.current.has(municipioNome)) return;
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

  const fecharSidebar = () => setMunicipioSelecionado(null);

  return (
    <>
      <MapContainer center={[-14.235, -51.9253]} zoom={4} style={{ height: '100vh', width: '100vw' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap contributors' />
        <MarkerClusterGroup>
          {municipios.map((municipio) => {
            const icon = defaultIcon;
            return (
              <Marker
                key={municipio.nome}
                position={[municipio.lat, municipio.lon]}
                icon={icon}
                eventHandlers={{
                  click: () => fetchData(municipio.lat, municipio.lon, municipio.nome)
                }}
              />
            );
          })}
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
    </>
  );
};

export default MapaBrasil;

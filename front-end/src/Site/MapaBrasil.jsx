import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import municipios from '../municipios.json';
import { useState, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';

const API_URL = 'http://localhost:8000/predict/';

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const MapaBrasil = () => {
  const [dados, setDados] = useState({});
  const pendingRequests = useRef(new Set());

  const fetchData = async (lat, lon, municipioNome) => {
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
    }
  };

  return (
    <MapContainer center={[-14.235, -51.9253]} zoom={4} style={{ height: '100vh', width: '100vw' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap contributors' />
      <MarkerClusterGroup>
        {municipios.map((municipio) => {
          const info = dados[municipio.nome];
          const icon = defaultIcon;

          return (
            <Marker
              key={municipio.nome}
              position={[municipio.lat, municipio.lon]}
              icon={icon}
              eventHandlers={{ click: () => fetchData(municipio.lat, municipio.lon, municipio.nome) }}
            >
              <Popup>
                <h3>{municipio.nome}</h3>
                {info ? (
                  info.erro ? (
                    <p style={{ color: 'red' }}>Erro ao obter dados</p>
                  ) : (
                    <p><strong>Probabilidade de enchente:</strong> {(info.probabilidade * 100).toFixed(2)}%</p>
                  )
                ) : (
                  <p style={{ fontStyle: 'italic' }}>⏳ Carregando...</p>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default MapaBrasil;

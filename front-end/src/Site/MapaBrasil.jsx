import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import municipios from '../municipios.json';
import { useState } from 'react';
import axios from 'axios';

const MapaBrasil = () => {
  const [temps, setTemps] = useState({});

  const fetchTemperature = async (lat, lon, municipioNome) => {
    if (temps[municipioNome] !== undefined) return;

    const apiKey = '9afc53f9544d4a02a2e141129251102';
    const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=no`;
    try {
      const response = await axios.get(url);
      const temp = response.data.current.temp_c;
      setTemps((prevTemps) => ({
        ...prevTemps,
        [municipioNome]: temp,
      }));
    } catch (error) {
      console.error(`Erro ao buscar temperatura para ${municipioNome}:`, error);
      setTemps((prevTemps) => ({
        ...prevTemps,
        [municipioNome]: 'Erro',
      }));
    }
  };

  return (
    <MapContainer center={[-14.2350, -51.9253]} zoom={4} style={{ height: '100vh', width: '100vw' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MarkerClusterGroup>
        {municipios.map((municipio) => (
          <Marker
            key={municipio.nome}
            position={[municipio.lat, municipio.lon]}
            eventHandlers={{
              click: () => {
                fetchTemperature(municipio.lat, municipio.lon, municipio.nome);
              },
            }}
          >
            <Popup>
              <h3>{municipio.nome}</h3>
              <p>
                Temperatura:{' '}
                {temps[municipio.nome] !== undefined
                  ? `${temps[municipio.nome]}°C`
                  : 'Clique para carregar'}
              </p>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default MapaBrasil;
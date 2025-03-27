import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import municipios from './municipios.json'; // Seu arquivo JSON
import { useState } from 'react';
import axios from 'axios';

const MapaBrasil = () => {
  const [temps, setTemps] = useState({});

  // Função para buscar temperatura
  const fetchTemperature = async (lat, lon, municipioNome) => {
    // Verifica se a temperatura já foi buscada para evitar chamadas desnecessárias
    if (temps[municipioNome] !== undefined) return;

    const apiKey = '9afc53f9544d4a02a2e141129251102';
    const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=no`;
    try {
      const response = await axios.get(url);
      const temp = response.data.current.temp_c; // Temperatura em Celsius
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
    </MapContainer>
  );
};

export default MapaBrasil;
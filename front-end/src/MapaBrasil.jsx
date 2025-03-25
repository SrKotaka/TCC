import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import municipios from './municipios.json'; // Seu arquivo JSON
import { useState, useEffect } from 'react';
import axios from 'axios';

const MapaBrasil = () => {
  const [temps, setTemps] = useState({});

  // Função para buscar temperatura
  const fetchTemperature = async (lat, lon) => {
    const apiKey = '9afc53f9544d4a02a2e141129251102';
    const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=no`;
    const response = await axios.get(url);
    return response.data.current.temp_c; // Temperatura em Celsius
  };

  // Carregar temperaturas ao montar o componente
  useEffect(() => {
    const loadTemps = async () => {
      const tempData = {};
      for (const municipio of municipios) {
        const temp = await fetchTemperature(municipio.lat, municipio.lon);
        tempData[municipio.nome] = temp;
      }
      setTemps(tempData);
    };
    loadTemps();
  }, []);

  return (
    <MapContainer center={[-14.2350, -51.9253]} zoom={4} style={{ height: '100vh', width: '100vw' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {municipios.map((municipio) => (
        <Marker key={municipio.nome} position={[municipio.lat, municipio.lon]}>
          <Popup>
            <h3>{municipio.nome}</h3>
            <p>Temperatura: {temps[municipio.nome] ? `${temps[municipio.nome]}°C` : 'Carregando...'}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapaBrasil;
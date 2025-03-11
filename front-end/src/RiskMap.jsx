// RiskMap.js
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para ícones do Leaflet (necessário para React)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RiskMap({ city, floodRisk }) {
  // Coordenadas padrão (centro do Brasil)
  const defaultPosition = [-14.2350, -51.9253];

  // Coordenadas da cidade (pode ser obtida da API de geolocalização)
  const cityPosition = city ? [city.lat, city.lon] : defaultPosition;

  return (
    <MapContainer center={cityPosition} zoom={6} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {city && (
        <Marker position={cityPosition} icon={icon}>
          <Popup>
            <strong>{city.name}</strong>
            <br />
            Risco de Enchente: {floodRisk === 1 ? "Alto" : "Baixo"}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

export default RiskMap;
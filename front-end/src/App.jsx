import { useState, useEffect } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // Leaflet CSS
import L from "leaflet"; // Leaflet for custom icons
import io from "socket.io-client";
import "./App.css";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import FloodTips from "./FloodTips";

// Fix for Leaflet marker icons (if they don’t show up)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const socket = io("http://localhost:5000");

function App() {
  const [highRiskCities, setHighRiskCities] = useState([]);
  const [cityData, setCityData] = useState([]); // To store city data with coordinates
  const [sidebarOpen, setSidebarOpen] = useState(false); // For toggling sidebar

  // Fetch city data with coordinates (you’ll need to add coordinates to your CSV or fetch them)
  useEffect(() => {
    axios.get("http://localhost:5000/high_risk_cities").then((response) => {
      const highRisk = response.data.high_risk_cities || [];
      setCityData(highRisk); // Now includes lat/lon from the backend
      setHighRiskCities(highRisk.map((city) => city.city));
    });
  
    socket.on("risk_update", (data) => {
      alert(`ATENÇÃO: Risco de enchente atualizado para ${data.city}. Risco: ${data.flood_risk === 1 ? "Alto" : "Baixo"}`);
      axios.get("http://localhost:5000/high_risk_cities").then((response) => {
        const highRisk = response.data.high_risk_cities || [];
        setCityData(highRisk);
        setHighRiskCities(highRisk.map((city) => city.city));
      });
    });
  
    return () => {
      socket.off("risk_update");
    };
  }, []);

  // Custom red dot icon for flood risk
  const redDotIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  });

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="App">
              <div className="menu-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                ☰
              </div>
              <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
                <h2>Menu</h2>
                <ul>
                  <li>
                    <Link to="/flood-tips">Dicas para Enchentes</Link>
                  </li>
                </ul>
              </div>
              <MapContainer
                center={[-23.5505, -46.6333]}
                zoom={5}
                style={{ height: "100vh", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {cityData.map((city, index) => (
                  <Marker
                    key={index}
                    position={[city.lat, city.lon]}
                    icon={redDotIcon}
                  >
                    <Popup>
                      {city.city} <br /> Risco de Enchente: Alto
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          }
        />
        <Route path="/flood-tips" element={<FloodTips />} />
      </Routes>
    </Router>
  );
}

export default App;
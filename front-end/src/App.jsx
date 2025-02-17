import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [floodRisk, setFloodRisk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchWeather() {
    if (!city) {
      setError("Por favor, digite o nome de uma cidade.");
      return;
    }

    setLoading(true);
    setError(null);

    const API_KEY = "9afc53f9544d4a02a2e141129251102"; // Substitua pela sua chave da API
    const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}&aqi=no`;

  try{
      const response = await axios.get(url);
      setWeather(response.data);

      // Enviar dados para o backend de ML
      const mlResponse = await axios.post(
        "http://localhost:5000/predict",
        {
          precip_mm: response.data.current.precip_mm,
          humidity: response.data.current.humidity,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setFloodRisk(mlResponse.data.flood_risk);
    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      setError("Erro ao buscar os dados. Verifique o nome da cidade e tente novamente.");
      setWeather(null);
      setFloodRisk(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="App">
      <h1>Previsão de Enchentes</h1>
      <div>
        <input
          type="text"
          placeholder="Digite a cidade"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button onClick={fetchWeather} disabled={loading}>
          {loading ? "Buscando..." : "Buscar Clima"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {/* Seção de Dados Meteorológicos */}
      {weather && (
        <div className="weather-info">
          <h2>{weather.location.name}, {weather.location.country}</h2>
          <p>Temperatura: {weather.current.temp_c}°C</p>
          <p>Chuva: {weather.current.precip_mm} mm</p>
          <p>Umidade: {weather.current.humidity}%</p>
          <p>Vento: {weather.current.wind_kph} km/h</p>
          <img src={weather.current.condition.icon} alt="Condição do tempo" />
          <p>{weather.current.condition.text}</p>
        </div>
      )}

      {/* Seção de Previsão de Enchentes */}
      {floodRisk !== null && (
        <div className="flood-risk">
          <h2>Previsão de Enchentes</h2>
          <p>
            Risco de Enchente:{" "}
            <span className={floodRisk === 1 ? "high-risk" : "low-risk"}>
              {floodRisk === 1 ? "Alto" : "Baixo"}
            </span>
          </p>
          <p>
            {floodRisk === 1
              ? "Cuidado! Há risco de enchente na região."
              : "Nenhum risco de enchente detectado."}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
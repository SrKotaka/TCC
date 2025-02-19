import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [floodRisk, setFloodRisk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_KEY = "9afc53f9544d4a02a2e141129251102";

  async function fetchWeather() {
    if (!city.trim()) {
      setError("Por favor, digite o nome de uma cidade.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}&aqi=no`
      );

      setWeather(response.data);
      await fetchFloodRisk(response.data.current.precip_mm, response.data.current.humidity);
    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      setError("Erro ao buscar os dados. Verifique a cidade e tente novamente.");
      setWeather(null);
      setFloodRisk(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFloodRisk(precip_mm, humidity) {
    try {
      const response = await axios.post("http://localhost:5000/predict", {
        precip_mm,
        humidity,
      });

      setFloodRisk(response.data.flood_risk);
    } catch (error) {
      console.error("Erro ao processar previsão de enchente:", error);
      setError("Erro ao processar previsão de enchente.");
      setFloodRisk(null);
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

      {weather && (
        <div className="weather-info">
          <h2>{weather.location.name}, {weather.location.country}</h2>
          <p>Temperatura: {weather.current.temp_c}°C</p>
          <p>Chuva: {weather.current.precip_mm} mm</p>
          <p>Umidade: {weather.current.humidity}%</p>
          <p>Vento: {weather.current.wind_kph} km/h</p>
          <p>{weather.current.condition.text}</p>
        </div>
      )}

      {floodRisk !== null && (
        <div className={`flood-risk ${floodRisk === 1 ? "high-risk" : "low-risk"}`}>
          <h2>Previsão de Enchentes</h2>
          <p>Risco de Enchente: <strong>{floodRisk === 1 ? "Alto" : "Baixo"}</strong></p>
          <p>{floodRisk === 1 ? "Cuidado! Há risco de enchente na região." : "Nenhum risco detectado."}</p>
        </div>
      )}
    </div>
  );
}

export default App;

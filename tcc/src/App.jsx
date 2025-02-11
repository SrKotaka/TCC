import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);

  async function fetchWeather() {
    const API_KEY = "9afc53f9544d4a02a2e141129251102"; // Substitua pela sua chave
    const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}&aqi=no`;

    try {
      const response = await axios.get(url);
      setWeather(response.data);
    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      setWeather(null);
    }
  }

  return (
    <div>
      <h1>Previsão de Enchentes</h1>
      <input
        type="text"
        placeholder="Digite a cidade"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      <button onClick={fetchWeather}>Buscar Clima</button>

      {weather && (
        <div>
          <h2>{weather.location.name}, {weather.location.country}</h2>
          <p>Temperatura: {weather.current.temp_c}°C</p>
          <p>Chuva: {weather.current.precip_mm} mm</p>
          <p>Umidade: {weather.current.humidity}%</p>
          <p>Vento: {weather.current.wind_kph} km/h</p>
          <img src={weather.current.condition.icon} alt="Condição do tempo" />
          <p>{weather.current.condition.text}</p>
        </div>
      )}
    </div>
  );
}

export default App;

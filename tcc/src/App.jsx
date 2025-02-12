import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [city, setCity] = useState(""); // Estado para armazenar a cidade digitada
  const [weather, setWeather] = useState(null); // Estado para armazenar os dados do clima
  const [loading, setLoading] = useState(false); // Estado para controlar o carregamento
  const [error, setError] = useState(null); // Estado para armazenar erros

  async function fetchWeather() {
    if (!city) {
      setError("Por favor, digite o nome de uma cidade.");
      return;
    }

    setLoading(true); // Ativa o estado de carregamento
    setError(null); // Limpa erros anteriores

    const API_KEY = "9afc53f9544d4a02a2e141129251102"; // Substitua pela sua chave da API
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=3&aqi=no&alerts=no`;

    try {
      const response = await axios.get(url); // Faz a requisição à API
      setWeather(response.data); // Armazena os dados do clima no estado
    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      setError("Erro ao buscar os dados. Verifique o nome da cidade e tente novamente.");
      setWeather(null); // Limpa os dados anteriores em caso de erro
    } finally {
      setLoading(false); // Desativa o estado de carregamento
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
          <p>Região: {weather.location.region}</p>
          <p>Localização: {weather.location.lat}, {weather.location.lon}</p>
          <p>Última atualização: {weather.current.last_updated}</p>

          <h3>Condições Atuais</h3>
          <p>Temperatura: {weather.current.temp_c}°C</p>
          <p>Sensação Térmica: {weather.current.feelslike_c}°C</p>
          <p>Chuva: {weather.current.precip_mm} mm</p>
          <p>Umidade: {weather.current.humidity}%</p>
          <p>Vento: {weather.current.wind_kph} km/h ({weather.current.wind_dir})</p>
          <p>Pressão Atmosférica: {weather.current.pressure_mb} mb</p>
          <p>Índice UV: {weather.current.uv}</p>
          <img src={weather.current.condition.icon} alt="Condição do tempo" />
          <p>{weather.current.condition.text}</p>

          <h3>Previsão para os Próximos Dias</h3>
          {weather.forecast.forecastday.map((day, index) => (
            <div key={index} className="forecast-day">
              <h4>{day.date}</h4>
              <p>Máxima: {day.day.maxtemp_c}°C</p>
              <p>Mínima: {day.day.mintemp_c}°C</p>
              <p>Chuva: {day.day.totalprecip_mm} mm</p>
              <p>Vento: {day.day.maxwind_kph} km/h</p>
              <p>Índice UV: {day.day.uv}</p>
              <img src={day.day.condition.icon} alt="Condição do tempo" />
              <p>{day.day.condition.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
import { useState, useEffect } from "react";
import axios from "axios";
import RiskMap from "./RiskMap";
import "./App.css";
import io from "socket.io-client";

const socket = io("http://localhost:5000");  // Conecta ao servidor WebSocket

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [floodRisk, setFloodRisk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [highRiskCities, setHighRiskCities] = useState([]);
  const [cityCoords, setCityCoords] = useState(null);

  const API_KEY = "9afc53f9544d4a02a2e141129251102";

  // Configura o listener para notificações em tempo real
  useEffect(() => {
    socket.on("risk_update", (data) => {
      alert(`ATENÇÃO: Risco de enchente atualizado para ${data.city}. Risco: ${data.flood_risk === 1 ? "Alto" : "Baixo"}`);
    });

    return () => {
      socket.off("risk_update");  // Limpa o listener ao desmontar o componente
    };
  }, []);

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

      // Extrair coordenadas da cidade
      const cityCoords = {
        name: response.data.location.name,
        lat: response.data.location.lat,
        lon: response.data.location.lon,
      };
      setCityCoords(cityCoords);

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

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setFloodRisk(response.data.flood_risk);
    } catch (error) {
      console.error("Erro ao processar previsão de enchente:", error);
      setError("Erro ao processar previsão de enchente: " + error.message);
      setFloodRisk(null);
    }
  }

  async function trainModel(floodRiskReal) {
    try {
      await axios.post("http://localhost:5000/train", {
        city: weather.location.name,  // Incluindo o nome da cidade
        precip_mm: weather.current.precip_mm,
        humidity: weather.current.humidity,
        flood_risk: floodRiskReal,
      });

      alert("Modelo atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao treinar o modelo:", error);
      setError("Erro ao atualizar o modelo.");
    }
  }

  return (
    <div className="App">
      <h1>Previsão de Enchentes</h1>

      <div className="rolling-marquee">
        <div className="marquee-text">
          {highRiskCities.length > 0
            ? `Possíveis cidades com enchente: ${highRiskCities.join(", ")}`
            : "Nenhuma cidade com risco detectado"}
        </div>
      </div>

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
          <h2>Risco</h2>
          <p>Risco de Enchente: <strong>{floodRisk === 1 ? "Alto" : "Baixo"}</strong></p>
          <p>{floodRisk === 1 ? "Cuidado! Há risco de enchente na região." : "Nenhum risco detectado."}</p>
        </div>
      )}

      {floodRisk !== null && (
        <div>
          <h2>Enviar previsão para a inteligência artificial</h2>
          <button onClick={() => trainModel(floodRisk)}>Enviar</button>
        </div>
      )}

      {floodRisk !== null && cityCoords && (
        <div className="map-container">
          <h2>Mapa de Risco</h2>
          <RiskMap city={cityCoords} floodRisk={floodRisk} />
        </div>
      )}

{city && weather && floodRisk !== null && (
  <div className="social-popups">
    {/* WhatsApp e Twitter */}
    <div className="whatsapp-popup">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(
          `Olá! O risco de enchente para a cidade de ${weather.location.name} é: \nTemperatura: ${weather.current.temp_c}°C\nChuva: ${weather.current.precip_mm} mm\nUmidade: ${weather.current.humidity}%\nRisco de Enchente: ${floodRisk === 1 ? "Alto" : "Baixo"}`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="WhatsApp"
        />
      </a>
    </div>

    <div className="twitter-popup">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `Olá! O risco de enchente para a cidade de ${weather.location.name} é: \nTemperatura: ${weather.current.temp_c}°C\nChuva: ${weather.current.precip_mm} mm\nUmidade: ${weather.current.humidity}%\nRisco de Enchente: ${floodRisk === 1 ? "Alto" : "Baixo"}`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg"
          alt="Twitter"
        />
      </a>
    </div>

    {/* Facebook com cópia automática da mensagem */}
    <div className="facebook-popup">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          window.location.href
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.preventDefault(); // Impede que o link abra imediatamente
          navigator.clipboard.writeText(
            `Olá! O risco de enchente para a cidade de ${weather.location.name} é: \nTemperatura: ${weather.current.temp_c}°C\nChuva: ${weather.current.precip_mm} mm\nUmidade: ${weather.current.humidity}%\nRisco de Enchente: ${floodRisk === 1 ? "Alto" : "Baixo"}`
          ).then(() => {
            alert("Mensagem copiada para a área de transferência!"); // Notifica o usuário
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                window.location.href
              )}`,
              "_blank"
            ); // Abre o Facebook após copiar
          });
        }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
          alt="Facebook"
        />
      </a>
    </div>
  </div>
)}
    </div>
  );
}

export default App;
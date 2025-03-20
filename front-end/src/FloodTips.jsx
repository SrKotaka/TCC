import { Link } from "react-router-dom";

function FloodTips() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Dicas para Enchentes</h1>
      <ul>
        <li>Evite áreas baixas e próximas a rios.</li>
        <li>Mantenha-se informado sobre alertas de enchente.</li>
        <li>Prepare um kit de emergência com água, comida e documentos.</li>
        <li>Se necessário, evacue para um local seguro.</li>
      </ul>
      <Link to="/">Voltar ao Mapa</Link>
    </div>
  );
}

export default FloodTips;
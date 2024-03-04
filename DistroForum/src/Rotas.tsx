import { Routes, Route } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import DistroForum from './src/DistroForum.tsx';
import Account from './src/Account.tsx';

function Rotas() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DistroForum />} />
        <Route path="/Account" element={<Account />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Rotas
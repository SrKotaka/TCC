import { Routes, Route } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import DistroForum from './src/DistroForum.tsx';
import Account from './src/Account.tsx';
import NewPost from './src/NewPost.tsx';

function Rotas() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DistroForum />} />
        <Route path="/Account" element={<Account />} />
        <Route path="/NewPost" element={<NewPost />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Rotas
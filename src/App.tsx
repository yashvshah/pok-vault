
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import VaultPage from "./pages/valut";
import MarketsPage from "./pages/marketsPage";

function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<Navigate to="/vault" />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/markets" element={<MarketsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

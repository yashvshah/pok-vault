
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import VaultPage from "./pages/valut";
import MarketsPage from "./pages/marketsPage";
import ManageMarketsPage from "./pages/ManageMarketsPage";

function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<Navigate to="/vault" />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/markets" element={<MarketsPage />} />
        <Route path="/manage-markets" element={<ManageMarketsPage />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;

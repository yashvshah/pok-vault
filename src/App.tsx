
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import Footer from "./components/Footer";
import VaultPage from "./pages/vault";
import MarketsPage from "./pages/marketsPage";
import ManageMarketsPage from "./pages/ManageMarketsPage";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 10000,
          style: {
            background: '#1c0e0e',
            color: '#fff',
            border: '1px solid rgba(236, 103, 105, 0.3)',
            borderRadius: '8px',
          },
        }}
      />
      <Header />

      <Routes>
        <Route path="/" element={<Navigate to="/vault" />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/markets" element={<MarketsPage />} />
        <Route path="/markets/:providerPair" element={<MarketsPage />} />
        <Route path="/manage-markets" element={<ManageMarketsPage />} />
        <Route path="/manage-markets/:providerPair" element={<ManageMarketsPage />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;

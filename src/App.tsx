import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import VaultActivitiesTest from "./components/VaultActivitiesTest";
import MarketsTest from "./components/MarketsTest";

function App() {
  return (
    <Router>
      <Link
        to="/"
        className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
      >
        Vault Activities
      </Link>
      <Link
        to="/markets"
        className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
      >
        Markets
      </Link>
      <Routes>
        <Route path="/" element={<VaultActivitiesTest />} />
        <Route path="/markets" element={<MarketsTest />} />
      </Routes>
    </Router>
  );
}

export default App;

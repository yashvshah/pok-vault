import { NavLink } from "react-router-dom";
import ConnectWallets from "./ConnectButton";

const linkClass = "px-4 py-2 rounded-lg text-gray-400 hover:text-white";

const Header = () => {
  return (
    <header>
      <div className="flex justify-between items-center px-28 py-6">
        <div className="w-44">
          <img src="src/assets/images/POK - LOGO.svg" alt="logo" />
        </div>

        <nav className="flex gap-2 bg-cardDark p-1 rounded-xl">
          <NavLink
            to="/vault"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? "text-white bg-[#302020]" : ""}`
            }
          >
            Vault
          </NavLink>

          <NavLink
            to="/markets"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? "text-white bg-[#302020]" : ""}`
            }
          >
            Markets
          </NavLink>
        </nav>

        <ConnectWallets />
      </div>
      <div className="w-full h-px bg-linear-to-r from-transparent via-primary to-transparent opacity-60" />
    </header>
  );
};

export default Header;

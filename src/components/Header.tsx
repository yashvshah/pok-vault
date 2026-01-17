import { NavLink } from "react-router-dom";
import ConnectWallets from "./ConnectButton";
import { useAccount } from "wagmi";
import { VAULT_OWNER_ADDRESS } from "../config/addresses";

const linkClass = "px-3 sm:px-4 py-2 rounded-lg text-gray-400 hover:text-white whitespace-nowrap";

const Header = () => {
  const account = useAccount();
  return (
    <header>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-4 sm:px-6 md:px-12 lg:px-28 py-4 md:py-6">
        <div className="w-32 sm:w-36 md:w-44">
          <img src="src/assets/images/POK_LOGO.svg" alt="logo" className="w-full h-auto" />
        </div>

        <nav className="flex flex-wrap justify-center gap-1 sm:gap-2 bg-cardDark p-1 rounded-xl text-sm sm:text-base">
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
          {account.isConnected &&
            account.address &&
            account.address.toLowerCase() ==
              VAULT_OWNER_ADDRESS.toLowerCase() && (
              <NavLink
                to="/manage-markets"
                className={({ isActive }) =>
                  `${linkClass} ${isActive ? "text-white bg-[#302020]" : ""}`
                }
              >
                Manage Markets
              </NavLink>
            )}
        </nav>

        <div className="w-full md:w-auto flex justify-center">
          <ConnectWallets />
        </div>
      </div>
      <div className="w-full h-px bg-linear-to-r from-transparent via-primary to-transparent opacity-60" />
    </header>
  );
};

export default Header;

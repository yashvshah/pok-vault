import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, WagmiProvider } from "wagmi";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { polygon, bsc } from "wagmi/chains";

const config = getDefaultConfig({
  appName: "POKVault",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [bsc, polygon],
  transports: {
    [bsc.id]:http(import.meta.env.VITE_BSC_RPC_URL || bsc.rpcUrls.default.http[0]),
    [polygon.id]:http(import.meta.env.VITE_POLYGON_RPC_URL || polygon.rpcUrls.default.http[0]),
  },

});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

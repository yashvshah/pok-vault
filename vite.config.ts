import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // this was needed to fix the wallet connect module not being properly opened
  optimizeDeps: {
    include: [
      "@rainbow-me/rainbowkit",
      "@walletconnect/modal",
      "@walletconnect/ethereum-provider",
      "wagmi",
      "viem",
    ],
  },
});

import { createConfig, http } from 'wagmi'
import { bsc, polygon } from 'wagmi/chains'

export const config = createConfig({
  chains: [polygon, bsc],
  transports: {
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
})
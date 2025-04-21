import { http, createConfig } from 'wagmi'
import { sepolia, polygonMumbai, hardhat } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// Get project ID from environment variable or use a valid placeholder
// You need to get a project ID from https://cloud.walletconnect.com/
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '04c63d18a20bd2063fa5a44ab714ae37'

// Create wagmi config
export const config = createConfig({
  chains: [sepolia, polygonMumbai, hardhat],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [sepolia.id]: http(),
    [polygonMumbai.id]: http(),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
})

export default config

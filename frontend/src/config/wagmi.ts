import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { hardhat, sepolia, polygonMumbai } from 'viem/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'BC-EventCard',
  projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID', // Bu değeri WalletConnect'ten almalısınız
  chains: [
    hardhat,
    sepolia,
    polygonMumbai
  ],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [sepolia.id]: http('https://sepolia.infura.io/v3/YOUR_INFURA_KEY'), // Bu değeri Infura'dan almalısınız
    [polygonMumbai.id]: http('https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY') // Bu değeri Infura'dan almalısınız
  },
  ssr: true,
});

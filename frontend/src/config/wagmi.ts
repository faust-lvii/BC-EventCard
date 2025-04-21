import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { hardhat, mainnet } from 'viem/chains';

// Bu örnek ve basit bir ID'dir - gerçek uygulamada değiştirin
const projectId = 'bc2e0f0e8b4f5e214d3c8fcb2e8cc5a9';

export const wagmiConfig = getDefaultConfig({
  appName: 'BC-EventCard',
  projectId: projectId,
  chains: [
    hardhat,
    mainnet
  ],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [mainnet.id]: http('https://ethereum.publicnode.com'),
  },
  // RainbowKit v2'de wallets özelliği dışarıda bırakılabilir
  // Bu durumda MetaMask dahil tüm desteklenen cüzdanlar gösterilir
});

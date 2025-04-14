import TicketNFTAbi from './abis/TicketNFT.json';
import EventManagerAbi from './abis/EventManager.json';

// Sözleşme adresleri - Hardhat local ağı (chainId: 31337) için varsayılan adresler
// Bu adresler, her dağıtımda değişecektir, o yüzden localhost'ta test ederken güncellenmelidir
export const CONTRACT_ADDRESSES = {
  // Local Hardhat Network
  31337: {
    ticketNFT: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // örnek adres, güncellenmeli
    eventManager: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // örnek adres, güncellenmeli
  },
  // Polygon Mumbai Testnet
  80001: {
    ticketNFT: '', // Mumbai'de dağıtıldığında güncellenecek
    eventManager: '', // Mumbai'de dağıtıldığında güncellenecek
  },
  // Ethereum Sepolia Testnet
  11155111: {
    ticketNFT: '', // Sepolia'da dağıtıldığında güncellenecek
    eventManager: '', // Sepolia'da dağıtıldığında güncellenecek
  }
};

// Sözleşme ABI'ları
export const CONTRACT_ABIS = {
  ticketNFT: TicketNFTAbi.abi,
  eventManager: EventManagerAbi.abi
};

export { TicketNFTAbi, EventManagerAbi };

// Contract addresses for different networks
// Replace with actual deployed contract addresses when available

// Development/localhost addresses - adjust based on your local deployment
const LOCAL_EVENT_MANAGER = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const LOCAL_TICKET_NFT = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'

// Testnet addresses - replace these with actual addresses from your deployments
const SEPOLIA_EVENT_MANAGER = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const SEPOLIA_TICKET_NFT = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'

const MUMBAI_EVENT_MANAGER = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const MUMBAI_TICKET_NFT = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'

// Determine which network is being used based on chainId or environment variable
// For now, default to local development addresses
export const EVENT_MANAGER_ADDRESS = LOCAL_EVENT_MANAGER
export const TICKET_NFT_ADDRESS = LOCAL_TICKET_NFT

// Function to get contract addresses based on chain ID
export const getContractAddresses = (chainId: number) => {
  switch (chainId) {
    case 11155111: // Sepolia
      return {
        eventManager: SEPOLIA_EVENT_MANAGER,
        ticketNFT: SEPOLIA_TICKET_NFT
      }
    case 80001: // Mumbai
      return {
        eventManager: MUMBAI_EVENT_MANAGER,
        ticketNFT: MUMBAI_TICKET_NFT
      }
    case 31337: // Hardhat
    default:
      return {
        eventManager: LOCAL_EVENT_MANAGER,
        ticketNFT: LOCAL_TICKET_NFT
      }
  }
} 
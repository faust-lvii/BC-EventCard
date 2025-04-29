# BC-EventCard: Blockchain-Based Event Ticketing System 

<div align="center">
  <img src="https://img.shields.io/badge/Blockchain-Ethereum-blue"/>
  <img src="https://img.shields.io/badge/NFT-ERC721-blueviolet"/>
  <img src="https://img.shields.io/badge/Smart%20Contracts-Solidity-orange"/>
  <img src="https://img.shields.io/badge/Frontend-React-61dafb"/>
  <img src="https://img.shields.io/badge/License-MIT-green"/>
</div>

## 🚀 Overview

BC-EventCard is a decentralized event ticketing platform built on blockchain technology. It leverages NFTs (Non-Fungible Tokens) to provide secure, transparent, and fraud-resistant digital tickets for events.

## ✨ Core Features

- **NFT-Based Tickets**: Each ticket is a unique NFT with verifiable ownership and authenticity
- **Event Creation**: Event organizers can create and manage events with customizable parameters
- **Secure Ticket Purchase**: Users can buy tickets directly using cryptocurrency
- **Ownership Transfer**: Tickets can be securely transferred between users
- **On-Chain Validation**: Tickets can be verified at event entry using blockchain verification
- **IPFS Metadata**: Event and ticket metadata stored on decentralized storage

## 🛠️ Technology Stack

| Category | Technologies |
|----------|--------------|
| **Smart Contracts** | Solidity, OpenZeppelin (ERC-721) |
| **Blockchain Development** | Hardhat, Ethers.js |
| **Frontend** | React, Vite, TypeScript |
| **Web3 Integration** | Wagmi, RainbowKit, Viem |
| **Decentralized Storage** | IPFS, Pinata |
| **Test Networks** | Polygon Mumbai, Ethereum Sepolia |

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask or another Web3 wallet
- Test ETH on Mumbai or Sepolia networks

## 🔧 Installation & Setup

```bash
# Clone the repository
git clone https://github.com/faust-lvii/BC-EventCard.git
cd BC-EventCard

# Install dependencies
npm install

# Start development server
npm run dev

# Deploy smart contracts (requires proper .env configuration)
cd contracts
npx hardhat run scripts/deploy.js --network mumbai
```

## 📝 Environment Variables

Create a `.env` file in the frontend directory with the following:

```
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_ETHEREUM_RPC_URL=your_ethereum_rpc_url
VITE_POLYGON_RPC_URL=your_polygon_rpc_url
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [Deployed Application](https://.com)
- [Smart Contract Documentation](./docs/smart.md)
- [API Documentation](./docs/api.md)

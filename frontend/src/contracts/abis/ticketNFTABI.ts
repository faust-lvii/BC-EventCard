import { parseAbi } from 'viem';

// Define the ABI for the TicketNFT contract
export const ticketNFTABI = parseAbi([
  // View functions
  'function usedTickets(uint256) view returns (bool)',
  'function ticketToEvent(uint256) view returns (uint256)',
  'function authorizedMinters(address) view returns (bool)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  
  // State-changing functions
  'function mintTicket(address recipient, string memory tokenURI, uint256 eventId) returns (uint256)',
  'function markTicketAsUsed(uint256 ticketId)',
  'function setBaseURI(string memory baseURI)',
  
  // Admin functions
  'function addMinter(address minter)',
  'function removeMinter(address minter)',
  'function withdraw()',
  
  // ERC721 transfer functions
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)'
]);

// Export individual functions for cleaner usage
export const ticketNFTFunctions = {
  mintTicket: 'mintTicket',
  markTicketAsUsed: 'markTicketAsUsed',
  isTicketUsed: 'isTicketUsed',
  ticketToEvent: 'ticketToEvent',
  addMinter: 'addMinter',
  removeMinter: 'removeMinter',
  setBaseURI: 'setBaseURI',
  withdraw: 'withdraw'
} as const;

export default ticketNFTABI; 
import { parseAbi } from 'viem';

// Define the ABI for the EventManager contract
export const eventManagerABI = parseAbi([
  // Event struct
  'struct Event { uint256 id; string name; uint256 date; uint256 price; uint256 maxTickets; uint256 soldTickets; bool active; address organizer; string metadataBase; }',
  
  // View functions
  'function events(uint256) view returns (Event)',
  'function ticketNFT() view returns (address)',
  'function validators(address) view returns (bool)',
  
  // State-changing functions
  'function createEvent(string memory name, uint256 date, uint256 price, uint256 maxTickets, string memory metadataBase) returns (uint256)',
  'function purchaseTicket(uint256 eventId) payable returns (uint256)',
  'function validateTicket(uint256 ticketId)',
  'function setEventActive(uint256 eventId, bool active)',
  'function withdrawEventProceeds(uint256 eventId)',
  
  // Admin functions
  'function addValidator(address validator)',
  'function removeValidator(address validator)',
  
  // Events
  'event EventCreated(uint256 indexed eventId, string name, address organizer)',
  'event TicketPurchased(uint256 indexed eventId, uint256 indexed ticketId, address buyer)',
  'event TicketValidated(uint256 indexed ticketId, uint256 indexed eventId)'
]);

// Export individual functions for cleaner usage
export const eventManagerFunctions = {
  createEvent: 'createEvent',
  purchaseTicket: 'purchaseTicket',
  validateTicket: 'validateTicket',
  setEventActive: 'setEventActive',
  withdrawEventProceeds: 'withdrawEventProceeds',
  addValidator: 'addValidator',
  removeValidator: 'removeValidator'
} as const;

export default eventManagerABI; 
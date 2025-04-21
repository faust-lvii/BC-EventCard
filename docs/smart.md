# Smart Contract Documentation

This document provides an overview of the smart contracts used in the BC-EventCard project, their functionality, and how they interact with each other.

## Table of Contents

- [Contract Architecture](#contract-architecture)
- [EventManager](#eventmanager)
- [TicketNFT](#ticketnft)
- [Contract Deployment](#contract-deployment)
- [Security Considerations](#security-considerations)
- [Testing](#testing)

## Contract Architecture

The system consists of two main smart contracts:

1. **EventManager**: Handles event creation, ticket sales, and validation
2. **TicketNFT**: ERC-721 compliant NFT contract for representing tickets

These contracts interact with each other to provide the complete ticketing system functionality:

```
                  ┌─────────────────┐
                  │                 │
 ┌────────────────┤   EventManager  ├────────────────┐
 │                │                 │                │
 │                └────────┬────────┘                │
 │                         │                         │
 │                         │ manages                 │
 │                         │                         │
 │                         ▼                         │
 │                ┌─────────────────┐                │
 │                │                 │                │
 │                │    TicketNFT    │                │
 │                │                 │                │
 │                └─────────────────┘                │
 │                                                   │
 │                                                   │
 ▼                                                   ▼
┌─────────────┐                               ┌─────────────┐
│             │                               │             │
│  Organizer  │                               │  Attendee   │
│             │                               │             │
└─────────────┘                               └─────────────┘
```

## EventManager

The EventManager contract handles event creation, ticket sales, and event management operations.

### State Variables

- `events`: Mapping of event IDs to Event structs
- `eventCounter`: Counter to generate unique event IDs
- `validators`: Mapping of addresses to boolean indicating if they're authorized to validate tickets
- `ticketNFT`: Address of the associated TicketNFT contract

### Event Struct

```solidity
struct Event {
    uint256 id;           // Unique identifier for the event
    string name;          // Name of the event
    uint256 date;         // Unix timestamp for the event date
    uint256 price;        // Ticket price in wei
    uint256 maxTickets;   // Maximum number of tickets available
    uint256 soldTickets;  // Number of tickets already sold
    bool active;          // Whether the event is active or not
    address organizer;    // Address of the event organizer
    string metadataBase;  // IPFS URI for the event metadata
}
```

### Key Functions

#### Event Creation

```solidity
function createEvent(
    string memory name, 
    uint256 date, 
    uint256 price, 
    uint256 maxTickets, 
    string memory metadataBase
) public returns (uint256)
```

This function allows anyone to create a new event by providing the event details. The caller becomes the organizer of the event.

#### Ticket Purchase

```solidity
function purchaseTicket(uint256 eventId) public payable returns (uint256)
```

Allows users to purchase a ticket for a specific event by sending the correct amount of ETH. The function mints a new NFT ticket.

#### Ticket Validation

```solidity
function validateTicket(uint256 ticketId) public
```

Allows authorized validators to validate a ticket at event entry.

#### Event Management

```solidity
function setEventActive(uint256 eventId, bool active) public
function withdrawEventProceeds(uint256 eventId) public
```

Enables organizers to manage their events by activating/deactivating them and withdrawing proceeds.

## TicketNFT

The TicketNFT contract is an ERC-721 compliant contract that represents event tickets as NFTs.

### Key Features

- Each NFT represents a single ticket to a specific event
- Tickets contain metadata linking to event details
- Tickets can be transferred between users
- Tickets can be validated once at event entry

### Ticket Metadata

```json
{
  "name": "Ticket #123 for Event ABC",
  "description": "Valid entry ticket for Event ABC on June 15, 2023",
  "image": "ipfs://QmXYZ...",
  "attributes": [
    {
      "trait_type": "Event ID",
      "value": "42"
    },
    {
      "trait_type": "Seat",
      "value": "General Admission"
    },
    {
      "trait_type": "Validated",
      "value": false
    }
  ]
}
```

## Contract Deployment

The deployment process involves:

1. Deploy the TicketNFT contract first
2. Deploy the EventManager contract, passing the TicketNFT address as a constructor parameter
3. Grant the EventManager contract the MINTER_ROLE in the TicketNFT contract

```javascript
async function deploy() {
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy("BC-EventCard Tickets", "BCET");
  await ticketNFT.deployed();
  
  const EventManager = await ethers.getContractFactory("EventManager");
  const eventManager = await EventManager.deploy(ticketNFT.address);
  await eventManager.deployed();
  
  // Grant minter role to EventManager
  const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
  await ticketNFT.grantRole(MINTER_ROLE, eventManager.address);
  
  return { ticketNFT, eventManager };
}
```

## Security Considerations

The contracts implement several security measures:

1. **Role-based access control**: OpenZeppelin's AccessControl for managing roles
2. **Reentrancy protection**: Using nonReentrant modifiers for functions handling ETH
3. **Input validation**: Checking for valid inputs to prevent unexpected behavior
4. **Event emission**: Events are emitted for all important state changes
5. **Withdrawal pattern**: Using pull over push for ETH transfers

## Testing

The contracts are thoroughly tested with unit and integration tests. To run the tests:

```bash
cd contracts
npx hardhat test
```

Key test scenarios include:
- Event creation and management
- Ticket purchasing and transfer
- Ticket validation
- Edge cases and error handling 
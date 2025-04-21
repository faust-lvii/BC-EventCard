# API Documentation

This document outlines the frontend API interactions with the blockchain in the BC-EventCard project.

## Table of Contents

- [Overview](#overview)
- [Contract Interactions](#contract-interactions)
- [Authentication](#authentication)
- [Events API](#events-api)
- [Tickets API](#tickets-api)
- [IPFS Integration](#ipfs-integration)
- [Error Handling](#error-handling)

## Overview

The BC-EventCard frontend interacts with the Ethereum blockchain using the following libraries:

- **Wagmi**: For React hooks that simplify blockchain interactions
- **Viem**: For Ethereum utilities and typed interactions
- **ethers.js**: For additional Ethereum functionality
- **RainbowKit**: For wallet connection UI and management

## Contract Interactions

The application primarily interacts with two smart contracts:

1. **EventManager**: Manages events, ticket sales, and validation
2. **TicketNFT**: Handles the NFT ticket representation

### Contract Adapter Pattern

We use a custom contract adapter pattern to simplify interactions with the blockchain:

```typescript
// Example adapter usage
const { data: eventData, isLoading } = useContractRead<EventDataTuple>({
  address: EVENT_MANAGER_ADDRESS,
  abi: eventManagerABI,
  functionName: 'events',
  args: [eventId],
});
```

## Authentication

Authentication in the application is wallet-based using Ethereum accounts.

### Wallet Connection

```typescript
// Connect wallet
const { connect, connectors, status } = useConnect();
const { address, isConnected } = useAccount();

// Example connection
const handleConnect = async (connector) => {
  await connect({ connector });
};
```

### Authorization

Different actions require different authorization levels:

- **Public Actions**: Viewing events, viewing ticket details
- **User Actions**: Purchasing tickets, transferring owned tickets
- **Organizer Actions**: Creating events, managing events, withdrawing funds
- **Validator Actions**: Validating tickets at event entry

## Events API

### Fetch All Events

Retrieves a list of all events.

```typescript
const useEvents = (options = {}) => {
  const [events, setEvents] = useState<Event[]>([]);

  // Query for event count
  const { data: eventCount } = useContractRead({
    address: EVENT_MANAGER_ADDRESS,
    abi: eventManagerABI,
    functionName: 'eventCounter',
  });

  // Logic to fetch events by ID
  // ...

  return { events, isLoading, error };
};
```

### Fetch Single Event

Retrieves details for a specific event by ID.

```typescript
const useEvent = (eventId: string) => {
  const { data: eventData, isLoading, isError } = useContractRead<EventDataTuple>({
    address: EVENT_MANAGER_ADDRESS,
    abi: eventManagerABI,
    functionName: 'events',
    args: [eventId ? BigInt(eventId) : BigInt(0)],
  });

  // Processing logic
  // ...

  return { event, isLoading, error };
};
```

### Create Event

Creates a new event.

```typescript
const useCreateEvent = () => {
  const { writeAsync: createEvent, data: txHash } = useContractWrite({
    address: EVENT_MANAGER_ADDRESS,
    abi: eventManagerABI,
    functionName: 'createEvent',
  });

  const createNewEvent = async (eventData) => {
    const { name, date, price, maxTickets, metadataBase } = eventData;
    
    return createEvent({
      args: [
        name,
        BigInt(Math.floor(date.getTime() / 1000)),
        BigInt(price),
        BigInt(maxTickets),
        metadataBase
      ]
    });
  };

  return { createNewEvent, txHash, isLoading, isSuccess };
};
```

## Tickets API

### Purchase Ticket

Purchases a ticket for a specific event.

```typescript
const usePurchaseTicket = () => {
  const { writeAsync: purchaseTicket, data: purchaseData } = useContractWrite({
    address: EVENT_MANAGER_ADDRESS,
    abi: eventManagerABI,
    functionName: 'purchaseTicket',
  });

  const buyTicket = async (eventId, price) => {
    return purchaseTicket({
      args: [BigInt(eventId)],
      value: price
    });
  };

  return { buyTicket, isLoading };
};
```

### Get User Tickets

Retrieves all tickets owned by the current user.

```typescript
const useUserTickets = (address) => {
  const { data: ticketBalance } = useContractRead({
    address: TICKET_NFT_ADDRESS,
    abi: ticketNFTABI,
    functionName: 'balanceOf',
    args: [address],
  });

  // Logic to fetch ticket IDs and details
  // ...

  return { tickets, isLoading, error };
};
```

### Validate Ticket

Validates a ticket for event entry.

```typescript
const useValidateTicket = () => {
  const { writeAsync: validateTicket } = useContractWrite({
    address: EVENT_MANAGER_ADDRESS,
    abi: eventManagerABI,
    functionName: 'validateTicket',
  });

  const validate = async (ticketId) => {
    return validateTicket({
      args: [BigInt(ticketId)]
    });
  };

  return { validate, isLoading };
};
```

## IPFS Integration

The application uses IPFS for storing event metadata and ticket images.

### Upload to IPFS

```typescript
const uploadToIPFS = async (file) => {
  // Implementation using Pinata or other IPFS service
  // ...
  return ipfsHash;
};
```

### Fetch from IPFS

```typescript
const fetchIPFSMetadata = async (ipfsUri) => {
  // Try multiple gateways
  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    try {
      const url = ipfsToHttpUrl(ipfsUri, i);
      const response = await fetch(url);
      
      if (!response.ok) continue;
      
      const metadata = await response.json();
      return metadata;
    } catch (error) {
      // Try next gateway
    }
  }
  
  // Failed to fetch from all gateways
  return null;
};
```

## Error Handling

The application implements a unified error handling system for blockchain interactions:

```typescript
const handleContractError = (error) => {
  // Extract error message from contract error
  let errorMessage = "An unknown error occurred";
  
  // Parse common error types
  if (error.reason) {
    errorMessage = error.reason;
  } else if (error.data?.message) {
    errorMessage = error.data.message;
  } else if (error.message) {
    // Clean up common prefix in ethers errors
    errorMessage = error.message.replace("execution reverted: ", "");
  }
  
  return errorMessage;
};
```

### Common Error Codes

| Error Code | Description | Handling Strategy |
|------------|-------------|-------------------|
| 4001 | User rejected transaction | Inform user, no retry |
| -32603 | Internal JSON-RPC error | Retry with exponential backoff |
| -32002 | Already processing ETH request | Inform user to check wallet |
| Custom | Contract-specific errors | Display user-friendly message | 
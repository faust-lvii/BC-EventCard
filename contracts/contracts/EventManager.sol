// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TicketNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title EventManager
 * @dev Manages events and ticket sales
 */
contract EventManager is Ownable, ReentrancyGuard {
    // Reference to the TicketNFT contract
    TicketNFT public ticketNFT;
    
    // Event structure
    struct Event {
        uint256 id;
        string name;
        uint256 date;          // Timestamp of event date
        uint256 price;         // Price in wei
        uint256 maxTickets;    // Maximum number of tickets
        uint256 soldTickets;   // Number of tickets sold
        bool active;           // Whether event is active
        address organizer;     // Event organizer
        string metadataBase;   // Base URI for ticket metadata
    }
    
    // Mapping from event ID to event details
    mapping(uint256 => Event) public events;
    
    // Counter for events
    uint256 private _eventIds;
    
    // Mapping of validators (addresses allowed to validate tickets)
    mapping(address => bool) public validators;
    
    // Events
    event EventCreated(uint256 indexed eventId, string name, address organizer);
    event TicketPurchased(uint256 indexed eventId, uint256 indexed ticketId, address buyer);
    event TicketValidated(uint256 indexed ticketId, uint256 indexed eventId);
    
    /**
     * @dev Constructor
     * @param _ticketNFT Address of the TicketNFT contract
     */
    constructor(address payable _ticketNFT) {
        ticketNFT = TicketNFT(_ticketNFT);
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Modifier to check if sender is event organizer
     * @param eventId ID of the event
     */
    modifier onlyOrganizer(uint256 eventId) {
        require(
            events[eventId].organizer == msg.sender || owner() == msg.sender,
            "Not the event organizer"
        );
        _;
    }
    
    /**
     * @dev Modifier to check if sender is a validator
     */
    modifier onlyValidator() {
        require(validators[msg.sender] || owner() == msg.sender, "Not authorized as validator");
        _;
    }
    
    /**
     * @dev Add a validator
     * @param validator Address to authorize as validator
     */
    function addValidator(address validator) external onlyOwner {
        validators[validator] = true;
    }
    
    /**
     * @dev Remove a validator
     * @param validator Address to remove as validator
     */
    function removeValidator(address validator) external onlyOwner {
        validators[validator] = false;
    }
    
    /**
     * @dev Create a new event
     * @param name Name of the event
     * @param date Timestamp of the event date
     * @param price Price of tickets in wei
     * @param maxTickets Maximum number of tickets
     * @param metadataBase Base URI for ticket metadata
     * @return uint256 ID of the created event
     */
    function createEvent(
        string memory name,
        uint256 date,
        uint256 price,
        uint256 maxTickets,
        string memory metadataBase
    ) external returns (uint256) {
        require(date > block.timestamp, "Event date must be in the future");
        require(maxTickets > 0, "Max tickets must be greater than zero");
        
        _eventIds++;
        uint256 newEventId = _eventIds;
        
        events[newEventId] = Event({
            id: newEventId,
            name: name,
            date: date,
            price: price,
            maxTickets: maxTickets,
            soldTickets: 0,
            active: true,
            organizer: msg.sender,
            metadataBase: metadataBase
        });
        
        emit EventCreated(newEventId, name, msg.sender);
        return newEventId;
    }
    
    /**
     * @dev Purchase a ticket for an event
     * @param eventId ID of the event
     * @return uint256 ID of the purchased ticket
     */
    function purchaseTicket(uint256 eventId) external payable nonReentrant returns (uint256) {
        Event storage event_ = events[eventId];
        
        require(event_.active, "Event is not active");
        require(block.timestamp < event_.date, "Event has already occurred");
        require(event_.soldTickets < event_.maxTickets, "Event is sold out");
        require(msg.value >= event_.price, "Insufficient payment");
        
        event_.soldTickets++;
        
        // Generate unique metadata URI for this ticket
        string memory ticketURI = string(
            abi.encodePacked(
                event_.metadataBase,
                "/",
                _toString(eventId),
                "_",
                _toString(event_.soldTickets)
            )
        );
        
        // Mint the ticket
        uint256 ticketId = ticketNFT.mintTicket(msg.sender, ticketURI, eventId);
        
        // Refund any excess payment
        if (msg.value > event_.price) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - event_.price}("");
            require(success, "Refund failed");
        }
        
        emit TicketPurchased(eventId, ticketId, msg.sender);
        return ticketId;
    }
    
    /**
     * @dev Validate a ticket at event check-in
     * @param ticketId ID of the ticket to validate
     */
    function validateTicket(uint256 ticketId) external onlyValidator {
        require(!ticketNFT.isTicketUsed(ticketId), "Ticket already used");
        
        uint256 eventId = ticketNFT.ticketToEvent(ticketId);
        Event storage event_ = events[eventId];
        
        require(event_.active, "Event is not active");
        
        // Mark ticket as used
        ticketNFT.markTicketAsUsed(ticketId);
        
        emit TicketValidated(ticketId, eventId);
    }
    
    /**
     * @dev Toggle event active status
     * @param eventId ID of the event
     * @param active New active status
     */
    function setEventActive(uint256 eventId, bool active) external onlyOrganizer(eventId) {
        events[eventId].active = active;
    }
    
    /**
     * @dev Withdraw event proceeds to organizer
     * @param eventId ID of the event
     */
    function withdrawEventProceeds(uint256 eventId) external onlyOrganizer(eventId) nonReentrant {
        Event storage event_ = events[eventId];
        
        uint256 amount = event_.price * event_.soldTickets;
        
        // Reset sold tickets count for accounting purposes
        event_.soldTickets = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Utility function to convert uint to string
     * @param value Value to convert
     * @return string String representation
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}

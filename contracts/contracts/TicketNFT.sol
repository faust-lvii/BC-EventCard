// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TicketNFT
 * @dev ERC721 token representing event tickets
 */
contract TicketNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Mapping from ticket ID to whether it's been used
    mapping(uint256 => bool) public usedTickets;
    
    // Mapping from ticket ID to event ID
    mapping(uint256 => uint256) public ticketToEvent;
    
    // Optional - keep track of minters (e.g., EventManager)
    mapping(address => bool) public authorizedMinters;
    
    // Optional - base URI for all tickets metadata
    string private _baseTokenURI;
    
    /**
     * @dev Constructor to initialize NFT metadata
     */
    constructor() ERC721("EtkinlikBileti", "EBT") {
        // Initialize with contract creator as owner
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Required for receiving ETH
     */
    receive() external payable {}
    
    /**
     * @dev Modifier to check if caller is authorized to mint
     */
    modifier onlyAuthorizedMinter() {
        require(
            authorizedMinters[msg.sender] || owner() == msg.sender,
            "Not authorized to mint tickets"
        );
        _;
    }
    
    /**
     * @dev Add a minter to authorized list
     * @param minter Address to authorize
     */
    function addMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
    }
    
    /**
     * @dev Remove a minter from authorized list
     * @param minter Address to remove authorization
     */
    function removeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
    }
    
    /**
     * @dev Mint a new ticket NFT
     * @param recipient Address to receive the ticket
     * @param tokenURI URI pointing to ticket metadata
     * @param eventId ID of the event this ticket is for
     * @return uint256 ID of the minted ticket
     */
    function mintTicket(
        address recipient,
        string memory tokenURI,
        uint256 eventId
    ) external onlyAuthorizedMinter nonReentrant returns (uint256) {
        _tokenIds.increment();
        uint256 newTicketId = _tokenIds.current();
        
        _mint(recipient, newTicketId);
        _setTokenURI(newTicketId, tokenURI);
        
        ticketToEvent[newTicketId] = eventId;
        usedTickets[newTicketId] = false;
        
        return newTicketId;
    }
    
    /**
     * @dev Mark a ticket as used (e.g., at event check-in)
     * @param ticketId ID of the ticket to mark used
     */
    function markTicketAsUsed(uint256 ticketId) external onlyAuthorizedMinter {
        require(_exists(ticketId), "Ticket does not exist");
        require(!usedTickets[ticketId], "Ticket already used");
        
        usedTickets[ticketId] = true;
    }
    
    /**
     * @dev Check if a ticket has been used
     * @param ticketId ID of the ticket to check
     * @return bool Whether the ticket has been used
     */
    function isTicketUsed(uint256 ticketId) external view returns (bool) {
        require(_exists(ticketId), "Ticket does not exist");
        return usedTickets[ticketId];
    }
    
    /**
     * @dev Set base URI for ticket metadata
     * @param baseURI Base URI to set
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Override base URI for all tokens
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Withdraw contract balance to owner
     */
    function withdraw() external onlyOwner nonReentrant {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
}

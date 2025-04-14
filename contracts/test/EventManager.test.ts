import { expect } from "chai";
import { ethers } from "hardhat";
import { EventManager, TicketNFT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("EventManager", function () {
  let ticketNFT: TicketNFT;
  let eventManager: EventManager;
  let owner: HardhatEthersSigner;
  let organizer: HardhatEthersSigner;
  let validator: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  const EVENT_NAME = "Test Event";
  const EVENT_PRICE = ethers.parseEther("0.1");
  const MAX_TICKETS = 100;
  const METADATA_BASE = "ipfs://testCID";

  // Helper function to extract event data from logs
  function extractEventArgFromLogs(logs: any[] | undefined, eventName: string, argName: string): any {
    if (!logs || logs.length === 0) {
      throw new Error(`No logs found`);
    }
    
    for (const log of logs) {
      try {
        const decoded = eventManager.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        
        if (decoded && decoded.name === eventName) {
          return decoded.args[argName];
        }
      } catch (e) {
        // Continue to next log if this one can't be parsed
        continue;
      }
    }
    
    throw new Error(`${eventName} event not found in logs`);
  }

  beforeEach(async function () {
    // Get signers
    [owner, organizer, validator, user1, user2] = await ethers.getSigners();

    // Deploy TicketNFT
    const TicketNFT = await ethers.getContractFactory("TicketNFT");
    ticketNFT = await TicketNFT.deploy();

    // Deploy EventManager
    const EventManager = await ethers.getContractFactory("EventManager");
    eventManager = await EventManager.deploy(await ticketNFT.getAddress());

    // Set up EventManager as authorized minter in TicketNFT
    await ticketNFT.addMinter(await eventManager.getAddress());

    // Set up validator
    await eventManager.addValidator(validator.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await eventManager.owner()).to.equal(owner.address);
    });

    it("Should set the correct TicketNFT address", async function () {
      expect(await eventManager.ticketNFT()).to.equal(await ticketNFT.getAddress());
    });
  });

  describe("Validator Management", function () {
    it("Should allow owner to add a validator", async function () {
      await eventManager.addValidator(user1.address);
      expect(await eventManager.validators(user1.address)).to.be.true;
    });

    it("Should allow owner to remove a validator", async function () {
      await eventManager.addValidator(user1.address);
      await eventManager.removeValidator(user1.address);
      expect(await eventManager.validators(user1.address)).to.be.false;
    });

    it("Should not allow non-owner to add a validator", async function () {
      await expect(
        eventManager.connect(user1).addValidator(user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Event Creation", function () {
    it("Should allow anyone to create an event", async function () {
      // Set event time to 1 day in the future
      const eventTime = await time.latest() + 86400;

      await expect(
        eventManager.connect(organizer).createEvent(
          EVENT_NAME,
          eventTime,
          EVENT_PRICE,
          MAX_TICKETS,
          METADATA_BASE
        )
      ).to.emit(eventManager, "EventCreated");

      const event = await eventManager.events(1);
      expect(event.name).to.equal(EVENT_NAME);
      expect(event.date).to.equal(eventTime);
      expect(event.price).to.equal(EVENT_PRICE);
      expect(event.maxTickets).to.equal(MAX_TICKETS);
      expect(event.soldTickets).to.equal(0);
      expect(event.active).to.be.true;
      expect(event.organizer).to.equal(organizer.address);
      expect(event.metadataBase).to.equal(METADATA_BASE);
    });

    it("Should not allow creating event with past date", async function () {
      const pastTime = await time.latest() - 86400;

      await expect(
        eventManager.createEvent(
          EVENT_NAME,
          pastTime,
          EVENT_PRICE,
          MAX_TICKETS,
          METADATA_BASE
        )
      ).to.be.revertedWith("Event date must be in the future");
    });

    it("Should not allow creating event with zero max tickets", async function () {
      const futureTime = await time.latest() + 86400;

      await expect(
        eventManager.createEvent(
          EVENT_NAME,
          futureTime,
          EVENT_PRICE,
          0,
          METADATA_BASE
        )
      ).to.be.revertedWith("Max tickets must be greater than zero");
    });
  });

  describe("Ticket Purchase", function () {
    let eventId: number;
    let eventTime: number;

    beforeEach(async function () {
      // Create an event
      eventTime = await time.latest() + 86400;
      const tx = await eventManager.connect(organizer).createEvent(
        EVENT_NAME,
        eventTime,
        EVENT_PRICE,
        MAX_TICKETS,
        METADATA_BASE
      );
      const receipt = await tx.wait();
      
      // Extract event ID using helper function
      eventId = Number(extractEventArgFromLogs(receipt?.logs, "EventCreated", "eventId"));
    });

    it("Should allow purchasing a ticket", async function () {
      const purchaseTx = await eventManager.connect(user1).purchaseTicket(eventId, {
        value: EVENT_PRICE
      });
      
      const receipt = await purchaseTx.wait();
      // Verify TicketPurchased event was emitted
      const ticketPurchasedEvent = receipt?.logs.find(log => {
        try {
          const decoded = eventManager.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          return decoded?.name === "TicketPurchased";
        } catch (e) {
          return false;
        }
      });
      
      expect(ticketPurchasedEvent).to.not.be.undefined;

      // Check event updated
      const event = await eventManager.events(eventId);
      expect(event.soldTickets).to.equal(1);

      // Check user owns the NFT
      expect(await ticketNFT.ownerOf(1)).to.equal(user1.address);
      
      // Check ticket event mapping
      expect(await ticketNFT.ticketToEvent(1)).to.equal(eventId);
    });

    it("Should refund excess payment", async function () {
      const excessPayment = EVENT_PRICE + ethers.parseEther("0.1");
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      
      const tx = await eventManager.connect(user1).purchaseTicket(eventId, {
        value: excessPayment
      });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      
      // User should have spent exactly EVENT_PRICE + gas, not the excess
      const expectedBalance = balanceBefore - EVENT_PRICE - gasUsed;
      
      // Allow for a small margin of error due to gas estimation
      expect(balanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
    });

    it("Should not allow purchase with insufficient payment", async function () {
      const insufficientPayment = EVENT_PRICE - ethers.parseEther("0.01");
      
      await expect(
        eventManager.connect(user1).purchaseTicket(eventId, {
          value: insufficientPayment
        })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should not allow purchase when event is inactive", async function () {
      // Deactivate the event
      await eventManager.connect(organizer).setEventActive(eventId, false);
      
      await expect(
        eventManager.connect(user1).purchaseTicket(eventId, {
          value: EVENT_PRICE
        })
      ).to.be.revertedWith("Event is not active");
    });

    it("Should not allow purchase when event has occurred", async function () {
      // Move time past the event date
      await time.increaseTo(eventTime + 1);
      
      await expect(
        eventManager.connect(user1).purchaseTicket(eventId, {
          value: EVENT_PRICE
        })
      ).to.be.revertedWith("Event has already occurred");
    });

    it("Should not allow purchase when event is sold out", async function () {
      // Create an event with only 1 ticket
      const smallEventTx = await eventManager.connect(organizer).createEvent(
        "Small Event",
        eventTime,
        EVENT_PRICE,
        1,
        METADATA_BASE
      );
      
      const smallEventReceipt = await smallEventTx.wait();
      
      // Extract event ID using helper function
      const smallEventId = Number(extractEventArgFromLogs(smallEventReceipt?.logs, "EventCreated", "eventId"));
      
      // Purchase the only ticket
      await eventManager.connect(user1).purchaseTicket(smallEventId, {
        value: EVENT_PRICE
      });
      
      // Try to purchase another ticket
      await expect(
        eventManager.connect(user2).purchaseTicket(smallEventId, {
          value: EVENT_PRICE
        })
      ).to.be.revertedWith("Event is sold out");
    });
  });

  describe("Ticket Validation", function () {
    let eventId: number;
    let ticketId: number;

    beforeEach(async function () {
      // Create an event
      const eventTime = await time.latest() + 86400;
      const createTx = await eventManager.connect(organizer).createEvent(
        EVENT_NAME,
        eventTime,
        EVENT_PRICE,
        MAX_TICKETS,
        METADATA_BASE
      );
      const createReceipt = await createTx.wait();
      
      // Extract event ID using helper function
      eventId = Number(extractEventArgFromLogs(createReceipt?.logs, "EventCreated", "eventId"));
      
      // Purchase a ticket
      const purchaseTx = await eventManager.connect(user1).purchaseTicket(eventId, {
        value: EVENT_PRICE
      });
      const purchaseReceipt = await purchaseTx.wait();
      
      // Extract ticket ID using helper function
      ticketId = Number(extractEventArgFromLogs(purchaseReceipt?.logs, "TicketPurchased", "ticketId"));
    });

    it("Should allow validator to validate a ticket", async function () {
      const validateTx = await eventManager.connect(validator).validateTicket(ticketId);
      const validateReceipt = await validateTx.wait();
      
      // Verify TicketValidated event was emitted
      const ticketValidatedEvent = validateReceipt?.logs.find(log => {
        try {
          const decoded = eventManager.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          return decoded?.name === "TicketValidated";
        } catch (e) {
          return false;
        }
      });
      
      expect(ticketValidatedEvent).to.not.be.undefined;
      
      // Check ticket is marked as used
      expect(await ticketNFT.isTicketUsed(ticketId)).to.be.true;
    });

    it("Should not allow validating a ticket twice", async function () {
      await eventManager.connect(validator).validateTicket(ticketId);
      
      await expect(
        eventManager.connect(validator).validateTicket(ticketId)
      ).to.be.revertedWith("Ticket already used");
    });

    it("Should not allow non-validator to validate a ticket", async function () {
      await expect(
        eventManager.connect(user2).validateTicket(ticketId)
      ).to.be.revertedWith("Not authorized as validator");
    });
  });

  describe("Event Management", function () {
    let eventId: number;

    beforeEach(async function () {
      // Create an event
      const eventTime = await time.latest() + 86400;
      const tx = await eventManager.connect(organizer).createEvent(
        EVENT_NAME,
        eventTime,
        EVENT_PRICE,
        MAX_TICKETS,
        METADATA_BASE
      );
      const receipt = await tx.wait();
      
      // Extract event ID using helper function
      eventId = Number(extractEventArgFromLogs(receipt?.logs, "EventCreated", "eventId"));
      
      // Purchase some tickets
      await eventManager.connect(user1).purchaseTicket(eventId, {
        value: EVENT_PRICE
      });
      await eventManager.connect(user2).purchaseTicket(eventId, {
        value: EVENT_PRICE
      });
    });

    it("Should allow organizer to deactivate and reactivate event", async function () {
      // Deactivate
      await eventManager.connect(organizer).setEventActive(eventId, false);
      let event = await eventManager.events(eventId);
      expect(event.active).to.be.false;
      
      // Reactivate
      await eventManager.connect(organizer).setEventActive(eventId, true);
      event = await eventManager.events(eventId);
      expect(event.active).to.be.true;
    });

    it("Should not allow non-organizer to modify event", async function () {
      await expect(
        eventManager.connect(user1).setEventActive(eventId, false)
      ).to.be.revertedWith("Not the event organizer");
    });

    it("Should allow organizer to withdraw event proceeds", async function () {
      const organizerBalanceBefore = await ethers.provider.getBalance(organizer.address);
      
      const tx = await eventManager.connect(organizer).withdrawEventProceeds(eventId);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const organizerBalanceAfter = await ethers.provider.getBalance(organizer.address);
      
      // Organizer should have received EVENT_PRICE * 2 (minus gas)
      const expectedBalance = organizerBalanceBefore + EVENT_PRICE * 2n - gasUsed;
      
      expect(organizerBalanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
      
      // Check sold tickets counter is reset
      const event = await eventManager.events(eventId);
      expect(event.soldTickets).to.equal(0);
    });

    it("Should not allow non-organizer to withdraw proceeds", async function () {
      await expect(
        eventManager.connect(user1).withdrawEventProceeds(eventId)
      ).to.be.revertedWith("Not the event organizer");
    });
  });
});

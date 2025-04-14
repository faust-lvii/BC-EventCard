import { ethers } from "hardhat";

async function main() {
  console.log("Deploying contracts...");

  // Deploy TicketNFT first
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy();
  await ticketNFT.waitForDeployment();

  const ticketNFTAddress = await ticketNFT.getAddress();
  console.log(`TicketNFT deployed to: ${ticketNFTAddress}`);

  // Deploy EventManager with TicketNFT address
  const EventManager = await ethers.getContractFactory("EventManager");
  const eventManager = await EventManager.deploy(ticketNFTAddress);
  await eventManager.waitForDeployment();

  const eventManagerAddress = await eventManager.getAddress();
  console.log(`EventManager deployed to: ${eventManagerAddress}`);

  // Authorize EventManager as a minter in TicketNFT
  console.log("Setting up contract permissions...");
  const addMinterTx = await ticketNFT.addMinter(eventManagerAddress);
  await addMinterTx.wait();
  console.log("EventManager authorized as minter in TicketNFT");

  console.log("Deployment complete!");
  console.log({
    ticketNFT: ticketNFTAddress,
    eventManager: eventManagerAddress
  });
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

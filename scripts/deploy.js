const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Settings
  const NAME = "My NFT Collection";
  const SYMBOL = "MNC";
  const MAX_SUPPLY = 1000;
  const COST = hre.ethers.parseEther("10"); // 10 CRO

  const NFTCollection = await hre.ethers.getContractFactory("NFTCollection");
  const nft = await NFTCollection.deploy(NAME, SYMBOL, MAX_SUPPLY, COST);

  await nft.waitForDeployment();

  console.log("NFT Collection deployed to:", await nft.getAddress());
  
  // Verify (Wait a bit for propagation)
  console.log("Waiting for block confirmations...");
  await nft.deploymentTransaction().wait(5);

  try {
    await hre.run("verify:verify", {
      address: await nft.getAddress(),
      constructorArguments: [NAME, SYMBOL, MAX_SUPPLY, COST],
    });
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
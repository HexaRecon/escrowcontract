const hre = require("hardhat");

async function main() {
  console.log("Deploying BlockHashPredictor to Shardeum EVM Testnet...\n");

  const BlockHashPredictor = await hre.ethers.getContractFactory("BlockHashPredictor");
  const predictor = await BlockHashPredictor.deploy();
  await predictor.waitForDeployment();

  const address = await predictor.getAddress();
  console.log(`✅ BlockHashPredictor deployed at: ${address}`);
  console.log(`\n   Add this to your .env file:`);
  console.log(`   CONTRACT_ADDRESS=${address}\n`);
  console.log(`   View on explorer: https://explorer-mezame.shardeum.org/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

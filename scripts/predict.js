/**
 * predict.js – CLI tool to fetch the latest blockhash, generate prediction
 * options, let the user pick one (or enter their own), and submit it on-chain.
 *
 * Usage:
 *   node scripts/predict.js
 */

const { ethers } = require("ethers");
const readline = require("readline");
require("dotenv").config();

// ── Config ──────────────────────────────────────────────────────────────
const RPC_URL          = "https://api-mezame.shardeum.org";
const CHAIN_ID         = 8119;
const EXPLORER         = "https://explorer-mezame.shardeum.org";
const PRIVATE_KEY      = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xE5FF751467fFdE6F04E9469ca7d2Dba9B4d0d16D";

// Minimal ABI – only the functions we call
const ABI = [
  "function submitPrediction(bytes32 _predictedHash) external returns (uint256)",
  "function revealPrediction(uint256 _predictionId) external",
  "function currentBlockNumber() view returns (uint256)",
  "function getBlockHash(uint256 _blockNumber) view returns (bytes32)",
  "function totalPredictions() view returns (uint256)",
  "function getPrediction(uint256 _id) view returns (address,uint256,bytes32,bytes32,bool,bool,uint256)",
  "function getUserPredictions(address _user) view returns (uint256[])",
  "function latestStoredHash() view returns (bytes32)",
  "function latestStoredBlockNumber() view returns (uint256)",
  "event PredictionSubmitted(uint256 indexed predictionId, address indexed predictor, uint256 targetBlock, bytes32 predictedHash)",
  "event PredictionRevealed(uint256 indexed predictionId, address indexed predictor, bytes32 actualHash, bool correct)"
];

// ── Helpers ─────────────────────────────────────────────────────────────

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

/**
 * Generate prediction "options" by hashing the latest blockhash with
 * different salts.  These are NOT real predictions – nobody can truly
 * predict a blockhash – but they give the user quick choices derived
 * from the current chain state.
 */
function generateOptions(latestHash, blockNumber) {
  const options = [];
  for (let i = 1; i <= 4; i++) {
    const packed = ethers.solidityPackedKeccak256(
      ["bytes32", "uint256", "uint256"],
      [latestHash, blockNumber, i]
    );
    options.push(packed);
  }
  return options;
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  // Validate env
  if (!PRIVATE_KEY || PRIVATE_KEY === "your_private_key_here") {
    console.error("❌ Set PRIVATE_KEY in your .env file first.");
    process.exit(1);
  }
  if (!CONTRACT_ADDRESS) {
    console.error("❌ Set CONTRACT_ADDRESS in your .env file first (deploy the contract).");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  console.log("═══════════════════════════════════════════════════");
  console.log("          🔮  BLOCKHASH PREDICTOR  🔮");
  console.log("       Shardeum EVM Testnet (Chain 8119)");
  console.log("═══════════════════════════════════════════════════\n");

  // 1. Fetch latest block info
  const currentBlock = await provider.getBlockNumber();
  const latestBlock  = await provider.getBlock(currentBlock);
  const latestHash   = latestBlock.hash;

  console.log(`📦 Current block  : #${currentBlock}`);
  console.log(`🔗 Latest hash    : ${latestHash}`);
  console.log(`🎯 Predicting for : block #${currentBlock + 1}\n`);

  // 2. Generate prediction options
  const options = generateOptions(latestHash, currentBlock);

  console.log("── Choose a predicted hash (or enter your own) ──\n");
  options.forEach((opt, i) => {
    console.log(`  [${i + 1}] ${opt}`);
  });
  console.log(`  [5] Enter a custom bytes32 hash`);
  console.log();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const choice = await ask(rl, "Your choice (1-5): ");
  let predictedHash;

  if (choice === "5") {
    predictedHash = await ask(rl, "Enter your bytes32 hash (0x...): ");
    if (!predictedHash.startsWith("0x") || predictedHash.length !== 66) {
      console.error("❌ Invalid bytes32. Must be 0x + 64 hex chars.");
      rl.close();
      process.exit(1);
    }
  } else {
    const idx = parseInt(choice, 10) - 1;
    if (idx < 0 || idx > 3) {
      console.error("❌ Invalid choice.");
      rl.close();
      process.exit(1);
    }
    predictedHash = options[idx];
  }

  console.log(`\n📤 Submitting prediction: ${predictedHash}`);
  console.log("   (waiting for tx confirmation...)\n");

  try {
    const tx = await contract.submitPrediction(predictedHash);
    console.log(`   Tx hash: ${tx.hash}`);
    console.log(`   Explorer: ${EXPLORER}/tx/${tx.hash}`);

    const receipt = await tx.wait();
    // Parse the PredictionSubmitted event from receipt
    const iface = new ethers.Interface(ABI);
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({ topics: log.topics, data: log.data });
        if (parsed && parsed.name === "PredictionSubmitted") {
          console.log(`\n✅ Prediction stored on-chain!`);
          console.log(`   Prediction ID  : ${parsed.args[0]}`);
          console.log(`   Target Block   : ${parsed.args[2]}`);
          console.log(`   Predicted Hash : ${parsed.args[3]}`);
        }
      } catch (_) { /* skip non-matching logs */ }
    }
  } catch (err) {
    console.error(`\n❌ Transaction failed: ${err.message}`);
  }

  // Ask if they want to reveal a past prediction
  console.log("\n── Reveal a past prediction? ──\n");
  const revealChoice = await ask(rl, "Enter prediction ID to reveal (or press Enter to skip): ");

  if (revealChoice.trim() !== "") {
    const predId = parseInt(revealChoice, 10);
    console.log(`\n🔍 Revealing prediction #${predId}...`);
    try {
      const tx = await contract.revealPrediction(predId);
      console.log(`   Tx hash: ${tx.hash}`);
      const receipt = await tx.wait();
      const iface = new ethers.Interface(ABI);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics, data: log.data });
          if (parsed && parsed.name === "PredictionRevealed") {
            const correct = parsed.args[3];
            console.log(`\n   Actual Hash : ${parsed.args[2]}`);
            console.log(`   Correct?    : ${correct ? "✅ YES!" : "❌ No"}`);
          }
        } catch (_) { /* skip */ }
      }
    } catch (err) {
      console.error(`   ❌ Reveal failed: ${err.message}`);
    }
  }

  rl.close();
  console.log("\nDone! 🎉\n");
}

main();

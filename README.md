# 🔮 BlockHash Predictor — Shardeum EVM Testnet

Predict the next block hash on **Shardeum EVM Testnet** (Chain 8119).  
Your prediction is stored on-chain and can be revealed & verified once the target block is mined.

## Network Details

| Field             | Value                                    |
|-------------------|------------------------------------------|
| Network Name      | Shardeum EVM Testnet                     |
| RPC URL           | https://api-mezame.shardeum.org          |
| Chain ID          | 8119                                     |
| Block Explorer    | https://explorer-mezame.shardeum.org     |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your private key (funded with testnet SHM):

```
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

### 3. Compile the contract

```bash
npx hardhat compile
```

### 4. Deploy to Shardeum Testnet

```bash
npx hardhat run scripts/deploy.js --network shardeum
```

Copy the deployed address into `.env`:

```
CONTRACT_ADDRESS=0xDEPLOYED_ADDRESS
```

### 5. Use the CLI predictor

```bash
node scripts/predict.js
```

This will:
- Fetch the latest block hash
- Generate 4 prediction options (derived from the current hash)
- Let you pick one or enter your own
- Submit the prediction to the contract
- Optionally reveal a past prediction

### 6. Use the Web Frontend

Open `frontend/index.html` in a browser. Paste the deployed contract address at the bottom, connect MetaMask, and start predicting.

---

## How It Works

1. **Fetch** — The app reads the current block number and its hash from Shardeum RPC  
2. **Generate Options** — 4 candidate hashes are derived via `keccak256(latestHash, blockNumber, salt)`  
3. **Submit** — The user picks a hash (or enters their own). The contract stores it targeting `block.number + 1`  
4. **Reveal** — After the target block is mined, anyone can call `revealPrediction()` to compare the actual hash with the prediction  

> **Note:** The EVM only stores the last 256 block hashes. Predictions must be revealed within 256 blocks of the target.

## Project Structure

```
blockhashpred/
├── contracts/
│   └── BlockHashPredictor.sol    # Solidity contract
├── scripts/
│   ├── deploy.js                 # Deployment script
│   └── predict.js                # CLI predictor tool
├── frontend/
│   └── index.html                # Web UI (MetaMask)
├── hardhat.config.js             # Hardhat config with Shardeum network
├── .env.example                  # Environment template
└── README.md
```

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    shardeum: {
      url: "https://api-mezame.shardeum.org",
      chainId: 8119,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      shardeum: "no-api-key-needed",
    },
    customChains: [
      {
        network: "shardeum",
        chainId: 8119,
        urls: {
          apiURL: "https://explorer-mezame.shardeum.org/api",
          browserURL: "https://explorer-mezame.shardeum.org",
        },
      },
    ],
  },
};

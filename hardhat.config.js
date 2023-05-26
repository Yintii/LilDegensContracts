require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env" });
//live
const ALCHEMY_HTTP_URL = process.env.ALCHEMY_HTTP_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;
const ALCHEMY_HTTP_URL_GOERLI = process.env.ALCHEMY_HTTP_URL_GOERLI;

module.exports = {
  solidity: "0.8.9",
  networks: {
    mainnet: {
      url: ALCHEMY_HTTP_URL,
      accounts: [PRIVATE_KEY],
    },
    goerli: {
      url: ALCHEMY_HTTP_URL_GOERLI,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
};

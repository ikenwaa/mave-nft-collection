const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");

async function main() {
    const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
    // URL from where to extract the metadata for a Mave NFT
    const metadataURL = METADATA_URL;
    const maveNFTsContract = await ethers.getContractFactory("MaveNFTs");

    // deploy the contract
    const deployedMaveContract = await maveNFTsContract.deploy(
        metadataURL,
        whitelistContract
    );

    console.log(
        "Mave NFTs contract address",
        deployedMaveContract.address
    );
}

// Call the main function and catch if there is any error
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
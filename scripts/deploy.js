const {ethers} = require("hardhat");
require('dotenv').config({path: '.env'});
const priceInWei = ethers.utils.parseEther('0.0169');
const startTime = new Date('May 26, 2023 16:20:00 GMT-0700');
const timeStamp = Math.round(startTime.getTime() / 1000);

async function main() {
  const LilDegens = await ethers.getContractFactory("LilDegens");
  const lilDegens = await LilDegens.deploy(
                                            "LilDegens",
                                            "LD",
                                            3,
                                            priceInWei,
                                            timeStamp
                                          );

  await lilDegens.deployed();


    console.log("LilDegens deployed to:", lilDegens.address);

    console.log("Sleeping.....");
    await sleep(50000);

    await hre.run("verify:verify", {
      address: lilDegens.address,
      constructorArguments: ["LilDegens", "LD", 3, priceInWei, timeStamp],
    })

}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }
);
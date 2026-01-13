import { ethers, upgrades } from "hardhat";

async function main() {

  const OZMultiToken = await ethers.getContractFactory("OZMultiToken");
  const cc = await upgrades.upgradeProxy("0x0b9a65cC2Bb4b4c25834C6E943478beB1D9dA590", OZMultiToken);

  await cc.waitForDeployment();
  const address = await cc.getAddress();

  console.log(`Contract OZMultiToken Proxy updated to ${address}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

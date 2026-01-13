import { ethers, upgrades } from "hardhat";

async function main() {

  const OZMultiToken = await ethers.getContractFactory("OZMultiToken");
  const cc = await upgrades.deployProxy(OZMultiToken);

  await cc.waitForDeployment();
  const address = await cc.getAddress();

  console.log(`Contract OZMultiToken Proxy deployed to ${address}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

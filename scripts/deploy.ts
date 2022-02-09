import { ethers } from "hardhat";

export const comptrollerAddr: { [chId: string]: string } = {
  "1": "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",
  "4": "0x2eaa9d77ae4d8f9cdd9faacd44016e746485bddb",
  "42": "0x5eae89dc1c671724a672ff0630122ee834098657",
};

export const wBTCAddr: { [chId: string]: string } = {
  "4": "0x577D296678535e4903D59A4C929B718e1D575e0A",
};

export const tknAddresses: { [chId: string]: { [cTkn: string]: string } } = {
  "4": {
    cwBTC: "0x0014f450b8ae7708593f4a46f8fa6e5d50620f96",
    cBAT: "0xebf1a11532b93a529b5bc942b4baa98647913002",
    cDAI: "0x6d7f0754ffeb405d23c51ce938289d4835be3b14",
    // cETH: "0xd6801a1dffcd0a410336ef88def4320d6df1883e",
  },
  "1": {
    cwBTC: "0xc11b1268c1a384e55c48c2391d8d480264a3a7f4",
    cBAT: "0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e",
    cDAI: "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643",
    // cETH: "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5",
  },
};

async function main() {
  const chainID = (await ethers.provider.getNetwork()).chainId;
  const W3Saver = await ethers.getContractFactory("W3Saver");
  const w3Saver = await W3Saver.deploy(comptrollerAddr[chainID.toString()]);
  await w3Saver.deployed();
  console.log("W3Saver deployed to:", w3Saver.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

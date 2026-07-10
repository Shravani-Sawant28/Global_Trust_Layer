const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deployer:", deployer.address);

    const GTL = await ethers.getContractFactory("GTLToken");

    const token = await GTL.deploy();

    await token.waitForDeployment();

    console.log("==================================");
    console.log("GTL Token deployed!");
    console.log("Address:", await token.getAddress());
    console.log("==================================");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
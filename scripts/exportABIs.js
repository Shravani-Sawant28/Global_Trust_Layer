const fs = require("fs");
const path = require("path");

const contracts = ["MockUSDC", "EscrowFactory", "ReputationRegistry"];

contracts.forEach((name) => {
    const artifact = require(
        path.join(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`)
    );

    const exportData = {
        contractName: name,
        abi: artifact.abi,
    };

    fs.writeFileSync(
        path.join(__dirname, `../deployments/${name}.abi.json`),
        JSON.stringify(exportData, null, 2)
    );

    console.log(`✅ Exported ABI: deployments/${name}.abi.json`);
});

console.log("\nShare the entire /deployments folder with your teammates.");
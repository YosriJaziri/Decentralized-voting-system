const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const VoterRegistry = await hre.ethers.getContractFactory("VoterRegistry");
  const voterRegistry = await VoterRegistry.deploy();
  await voterRegistry.waitForDeployment();
  console.log("VoterRegistry deployed to:", voterRegistry.target);

  const ElectionManager = await hre.ethers.getContractFactory("ElectionManager");
  const electionManager = await ElectionManager.deploy();
  await electionManager.waitForDeployment();
  console.log("ElectionManager deployed to:", electionManager.target);

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(voterRegistry.target, electionManager.target);
  await voting.waitForDeployment();
  console.log("Voting deployed to:", voting.target);

  const Results = await hre.ethers.getContractFactory("Results");
  const results = await Results.deploy(electionManager.target, voting.target);
  await results.waitForDeployment();
  console.log("Results deployed to:", results.target);

  console.log("\nDeployment summary:");
  console.log(
    JSON.stringify(
      {
        voterRegistry: voterRegistry.target,
        electionManager: electionManager.target,
        voting: voting.target,
        results: results.target
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

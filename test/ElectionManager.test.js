const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ElectionManager", function () {
  let electionManager, admin, outsider;

  beforeEach(async function () {
    [admin, outsider] = await ethers.getSigners();
    const ElectionManager = await ethers.getContractFactory("ElectionManager");
    electionManager = await ElectionManager.deploy();
  });

  async function createDefaultElection(overrides = {}) {
    const now = await time.latest();
    const startTime = overrides.startTime ?? now + 60;
    const endTime = overrides.endTime ?? now + 3600;
    const candidateNames = overrides.candidateNames ?? ["Alice", "Bob"];
    const name = overrides.name ?? "Presidential Election";

    const tx = await electionManager.createElection(name, candidateNames, startTime, endTime);
    await tx.wait();
    return { startTime, endTime, candidateNames, name };
  }

  it("lets the admin create an election", async function () {
    const { startTime, endTime } = await createDefaultElection();

    const election = await electionManager.getElection(0);
    expect(election.name).to.equal("Presidential Election");
    expect(election.candidateNames).to.deep.equal(["Alice", "Bob"]);
    expect(election.startTime).to.equal(startTime);
    expect(election.endTime).to.equal(endTime);
    expect(await electionManager.electionCount()).to.equal(1);
  });

  it("rejects election creation from a non-admin", async function () {
    const now = await time.latest();
    await expect(
      electionManager
        .connect(outsider)
        .createElection("Election", ["Alice", "Bob"], now + 60, now + 3600)
    ).to.be.revertedWith("ElectionManager: caller is not admin");
  });

  it("rejects elections with fewer than 2 candidates", async function () {
    const now = await time.latest();
    await expect(
      electionManager.createElection("Election", ["Alice"], now + 60, now + 3600)
    ).to.be.revertedWith("ElectionManager: need at least 2 candidates");
  });

  it("rejects an end time before the start time", async function () {
    const now = await time.latest();
    await expect(
      electionManager.createElection("Election", ["Alice", "Bob"], now + 3600, now + 60)
    ).to.be.revertedWith("ElectionManager: endTime before startTime");
  });

  it("reports the election as closed before it starts and after it ends", async function () {
    const { startTime, endTime } = await createDefaultElection();

    expect(await electionManager.isElectionOpen(0)).to.equal(false);

    await time.increaseTo(startTime + 1);
    expect(await electionManager.isElectionOpen(0)).to.equal(true);

    await time.increaseTo(endTime + 1);
    expect(await electionManager.isElectionOpen(0)).to.equal(false);
    expect(await electionManager.hasElectionEnded(0)).to.equal(true);
  });
});

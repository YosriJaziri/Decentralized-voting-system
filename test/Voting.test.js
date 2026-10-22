const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Voting", function () {
  let voterRegistry, electionManager, voting;
  let admin, voter1, voter2, outsider;
  let startTime, endTime;

  beforeEach(async function () {
    [admin, voter1, voter2, outsider] = await ethers.getSigners();

    const VoterRegistry = await ethers.getContractFactory("VoterRegistry");
    voterRegistry = await VoterRegistry.deploy();

    const ElectionManager = await ethers.getContractFactory("ElectionManager");
    electionManager = await ElectionManager.deploy();

    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy(voterRegistry.target, electionManager.target);

    await voterRegistry.registerVoters([voter1.address, voter2.address]);

    const now = await time.latest();
    startTime = now + 60;
    endTime = now + 3600;
    await electionManager.createElection("Election", ["Alice", "Bob"], startTime, endTime);

    await time.increaseTo(startTime + 1);
  });

  it("lets a registered voter cast a vote while the election is open", async function () {
    await expect(voting.connect(voter1).vote(0, 0))
      .to.emit(voting, "VoteCast")
      .withArgs(0, voter1.address, 0);

    expect(await voting.hasVoted(0, voter1.address)).to.equal(true);
    expect(await voting.votesFor(0, 0)).to.equal(1);
    expect(await voting.totalVotes(0)).to.equal(1);
  });

  it("rejects a vote from an unregistered address", async function () {
    await expect(voting.connect(outsider).vote(0, 0)).to.be.revertedWith(
      "Voting: not an authorized voter"
    );
  });

  it("rejects a second vote from the same voter", async function () {
    await voting.connect(voter1).vote(0, 0);
    await expect(voting.connect(voter1).vote(0, 1)).to.be.revertedWith("Voting: already voted");
  });

  it("rejects a vote for an invalid candidate", async function () {
    await expect(voting.connect(voter1).vote(0, 5)).to.be.revertedWith("Voting: invalid candidate");
  });

  it("rejects a vote before the election opens", async function () {
    const now = await time.latest();
    const futureStart = now + 1000;
    const futureEnd = now + 2000;
    await electionManager.createElection("Future Election", ["Alice", "Bob"], futureStart, futureEnd);

    await expect(voting.connect(voter1).vote(1, 0)).to.be.revertedWith("Voting: election not open");
  });

  it("rejects a vote after the election closes", async function () {
    await time.increaseTo(endTime + 1);
    await expect(voting.connect(voter1).vote(0, 0)).to.be.revertedWith("Voting: election not open");
  });

  it("tracks separate vote counts per candidate", async function () {
    await voting.connect(voter1).vote(0, 0);
    await voting.connect(voter2).vote(0, 1);

    expect(await voting.votesFor(0, 0)).to.equal(1);
    expect(await voting.votesFor(0, 1)).to.equal(1);
    expect(await voting.totalVotes(0)).to.equal(2);
  });
});

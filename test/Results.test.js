const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Results", function () {
  let voterRegistry, electionManager, voting, results;
  let admin, voter1, voter2, voter3;
  let startTime, endTime;

  beforeEach(async function () {
    [admin, voter1, voter2, voter3] = await ethers.getSigners();

    const VoterRegistry = await ethers.getContractFactory("VoterRegistry");
    voterRegistry = await VoterRegistry.deploy();

    const ElectionManager = await ethers.getContractFactory("ElectionManager");
    electionManager = await ElectionManager.deploy();

    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy(voterRegistry.target, electionManager.target);

    const Results = await ethers.getContractFactory("Results");
    results = await Results.deploy(electionManager.target, voting.target);

    await voterRegistry.registerVoters([voter1.address, voter2.address, voter3.address]);

    const now = await time.latest();
    startTime = now + 60;
    endTime = now + 3600;
    await electionManager.createElection("Election", ["Alice", "Bob"], startTime, endTime);

    await time.increaseTo(startTime + 1);
    await voting.connect(voter1).vote(0, 0);
    await voting.connect(voter2).vote(0, 0);
    await voting.connect(voter3).vote(0, 1);
  });

  it("rejects reading results before the election closes", async function () {
    await expect(results.getResults(0)).to.be.revertedWith("Results: election still open");
  });

  it("returns vote counts per candidate once the election closes", async function () {
    await time.increaseTo(endTime + 1);

    const [names, counts] = await results.getResults(0);
    expect(names).to.deep.equal(["Alice", "Bob"]);
    expect(counts.map(Number)).to.deep.equal([2, 1]);
  });

  it("returns the winning candidate", async function () {
    await time.increaseTo(endTime + 1);

    const [winningId, winningName, winningVotes] = await results.getWinner(0);
    expect(winningId).to.equal(0);
    expect(winningName).to.equal("Alice");
    expect(winningVotes).to.equal(2);
  });

  it("emits ResultsPublished once and rejects re-publishing", async function () {
    await time.increaseTo(endTime + 1);

    await expect(results.publishResults(0))
      .to.emit(results, "ResultsPublished")
      .withArgs(0, 0, 2);

    expect(await results.published(0)).to.equal(true);
    await expect(results.publishResults(0)).to.be.revertedWith("Results: already published");
  });
});

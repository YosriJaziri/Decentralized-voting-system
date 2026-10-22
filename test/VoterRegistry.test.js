const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VoterRegistry", function () {
  let voterRegistry, admin, voter1, voter2, outsider;

  beforeEach(async function () {
    [admin, voter1, voter2, outsider] = await ethers.getSigners();
    const VoterRegistry = await ethers.getContractFactory("VoterRegistry");
    voterRegistry = await VoterRegistry.deploy();
  });

  it("sets the deployer as admin", async function () {
    expect(await voterRegistry.admin()).to.equal(admin.address);
  });

  it("lets the admin register a voter", async function () {
    await expect(voterRegistry.registerVoter(voter1.address))
      .to.emit(voterRegistry, "VoterRegistered")
      .withArgs(voter1.address);

    expect(await voterRegistry.isRegistered(voter1.address)).to.equal(true);
    expect(await voterRegistry.voterCount()).to.equal(1);
  });

  it("lets the admin register several voters at once", async function () {
    await voterRegistry.registerVoters([voter1.address, voter2.address]);
    expect(await voterRegistry.isRegistered(voter1.address)).to.equal(true);
    expect(await voterRegistry.isRegistered(voter2.address)).to.equal(true);
    expect(await voterRegistry.voterCount()).to.equal(2);
  });

  it("rejects registration from a non-admin", async function () {
    await expect(
      voterRegistry.connect(outsider).registerVoter(voter1.address)
    ).to.be.revertedWith("VoterRegistry: caller is not admin");
  });

  it("rejects double registration", async function () {
    await voterRegistry.registerVoter(voter1.address);
    await expect(voterRegistry.registerVoter(voter1.address)).to.be.revertedWith(
      "VoterRegistry: already registered"
    );
  });

  it("lets the admin remove a voter", async function () {
    await voterRegistry.registerVoter(voter1.address);
    await expect(voterRegistry.removeVoter(voter1.address))
      .to.emit(voterRegistry, "VoterRemoved")
      .withArgs(voter1.address);
    expect(await voterRegistry.isRegistered(voter1.address)).to.equal(false);
    expect(await voterRegistry.voterCount()).to.equal(0);
  });

  it("lets the admin transfer admin rights", async function () {
    await voterRegistry.transferAdmin(voter1.address);
    expect(await voterRegistry.admin()).to.equal(voter1.address);
  });
});

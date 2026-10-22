let provider;
let signer;
let voterRegistry;
let electionManager;
let voting;
let results;

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask (ou un wallet compatible) est requis pour cette demo.");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  voterRegistry = new ethers.Contract(CONTRACT_ADDRESSES.voterRegistry, VOTER_REGISTRY_ABI, signer);
  electionManager = new ethers.Contract(CONTRACT_ADDRESSES.electionManager, ELECTION_MANAGER_ABI, signer);
  voting = new ethers.Contract(CONTRACT_ADDRESSES.voting, VOTING_ABI, signer);
  results = new ethers.Contract(CONTRACT_ADDRESSES.results, RESULTS_ABI, signer);

  const address = await signer.getAddress();
  document.getElementById("account").textContent = `Connecte : ${address}`;
}

function toUnixTimestamp(datetimeLocalValue) {
  return Math.floor(new Date(datetimeLocalValue).getTime() / 1000);
}

async function registerVoter() {
  const statusEl = document.getElementById("registerVoterStatus");
  try {
    const address = document.getElementById("voterAddressInput").value.trim();
    statusEl.textContent = "Transaction en cours...";
    const tx = await voterRegistry.registerVoter(address);
    await tx.wait();
    statusEl.textContent = `Electeur ${address} enregistre.`;
  } catch (err) {
    statusEl.textContent = `Erreur : ${err.reason || err.message}`;
  }
}

async function createElection() {
  const statusEl = document.getElementById("createElectionStatus");
  try {
    const name = document.getElementById("electionNameInput").value.trim();
    const candidates = document
      .getElementById("candidatesInput")
      .value.split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    const startTime = toUnixTimestamp(document.getElementById("startTimeInput").value);
    const endTime = toUnixTimestamp(document.getElementById("endTimeInput").value);

    statusEl.textContent = "Transaction en cours...";
    const tx = await electionManager.createElection(name, candidates, startTime, endTime);
    const receipt = await tx.wait();
    statusEl.textContent = `Election creee (voir transaction ${receipt.hash}).`;
  } catch (err) {
    statusEl.textContent = `Erreur : ${err.reason || err.message}`;
  }
}

async function loadElection() {
  const infoEl = document.getElementById("electionInfo");
  const candidateListEl = document.getElementById("candidateList");
  candidateListEl.innerHTML = "";

  try {
    const electionId = document.getElementById("electionIdInput").value;
    const election = await electionManager.getElection(electionId);
    const isOpen = await electionManager.isElectionOpen(electionId);

    infoEl.innerHTML = `
      <p><strong>${election.name}</strong></p>
      <p>Statut : ${isOpen ? "ouverte" : "fermee"}</p>
    `;

    election.candidateNames.forEach((name, index) => {
      const btn = document.createElement("button");
      btn.textContent = `Voter pour ${name}`;
      btn.onclick = () => castVote(electionId, index);
      candidateListEl.appendChild(btn);
    });
  } catch (err) {
    infoEl.textContent = `Erreur : ${err.reason || err.message}`;
  }
}

async function castVote(electionId, candidateId) {
  const statusEl = document.getElementById("voteStatus");
  try {
    statusEl.textContent = "Transaction en cours...";
    const tx = await voting.vote(electionId, candidateId);
    await tx.wait();
    statusEl.textContent = "Vote enregistre avec succes.";
  } catch (err) {
    statusEl.textContent = `Erreur : ${err.reason || err.message}`;
  }
}

async function loadResults() {
  const outputEl = document.getElementById("resultsOutput");
  const statusEl = document.getElementById("resultsStatus");
  outputEl.innerHTML = "";

  try {
    const electionId = document.getElementById("resultsElectionIdInput").value;
    const [names, counts] = await results.getResults(electionId);

    const list = document.createElement("ul");
    names.forEach((name, index) => {
      const item = document.createElement("li");
      item.textContent = `${name} : ${counts[index]} vote(s)`;
      list.appendChild(item);
    });
    outputEl.appendChild(list);
    statusEl.textContent = "";
  } catch (err) {
    statusEl.textContent = `Erreur : ${err.reason || err.message}`;
  }
}

document.getElementById("connectBtn").addEventListener("click", connectWallet);
document.getElementById("registerVoterBtn").addEventListener("click", registerVoter);
document.getElementById("createElectionBtn").addEventListener("click", createElection);
document.getElementById("loadElectionBtn").addEventListener("click", loadElection);
document.getElementById("loadResultsBtn").addEventListener("click", loadResults);

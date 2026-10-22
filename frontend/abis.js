// Minimal ABIs limited to the functions/events used by the demo frontend.

const VOTER_REGISTRY_ABI = [
  "function admin() view returns (address)",
  "function voterCount() view returns (uint256)",
  "function isRegistered(address voter) view returns (bool)",
  "function registerVoter(address voter)",
  "function registerVoters(address[] voters)",
  "function removeVoter(address voter)",
  "event VoterRegistered(address indexed voter)",
  "event VoterRemoved(address indexed voter)"
];

const ELECTION_MANAGER_ABI = [
  "function admin() view returns (address)",
  "function electionCount() view returns (uint256)",
  "function createElection(string name, string[] candidateNames, uint256 startTime, uint256 endTime) returns (uint256)",
  "function getElection(uint256 electionId) view returns (string name, string[] candidateNames, uint256 startTime, uint256 endTime)",
  "function getCandidates(uint256 electionId) view returns (string[])",
  "function isElectionOpen(uint256 electionId) view returns (bool)",
  "function hasElectionEnded(uint256 electionId) view returns (bool)",
  "event ElectionCreated(uint256 indexed electionId, string name, uint256 candidateCount, uint256 startTime, uint256 endTime)"
];

const VOTING_ABI = [
  "function vote(uint256 electionId, uint256 candidateId)",
  "function hasVoted(uint256 electionId, address voter) view returns (bool)",
  "function votesFor(uint256 electionId, uint256 candidateId) view returns (uint256)",
  "function totalVotes(uint256 electionId) view returns (uint256)",
  "event VoteCast(uint256 indexed electionId, address indexed voter, uint256 indexed candidateId)"
];

const RESULTS_ABI = [
  "function getResults(uint256 electionId) view returns (string[] candidateNames, uint256[] voteCounts)",
  "function getWinner(uint256 electionId) view returns (uint256 winningCandidateId, string winningName, uint256 winningVoteCount)",
  "function publishResults(uint256 electionId)",
  "function published(uint256 electionId) view returns (bool)",
  "event ResultsPublished(uint256 indexed electionId, uint256 winningCandidateId, uint256 winningVoteCount)"
];

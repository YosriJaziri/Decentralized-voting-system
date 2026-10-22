// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./VoterRegistry.sol";
import "./ElectionManager.sol";

/// @title Voting
/// @notice Records votes for elections defined in ElectionManager, restricted to
/// addresses authorized in VoterRegistry, and prevents an address from voting twice
/// in the same election.
contract Voting {
    VoterRegistry public immutable voterRegistry;
    ElectionManager public immutable electionManager;

    // electionId => voter => hasVoted
    mapping(uint256 => mapping(address => bool)) private _hasVoted;
    // electionId => candidateId => voteCount
    mapping(uint256 => mapping(uint256 => uint256)) private _voteCounts;
    // electionId => total votes cast
    mapping(uint256 => uint256) public totalVotes;

    event VoteCast(uint256 indexed electionId, address indexed voter, uint256 indexed candidateId);

    constructor(address voterRegistryAddress, address electionManagerAddress) {
        voterRegistry = VoterRegistry(voterRegistryAddress);
        electionManager = ElectionManager(electionManagerAddress);
    }

    /// @notice Casts a vote for `candidateId` in `electionId`.
    /// @dev A voter must be registered, the election must currently be open, and the
    /// voter must not have already voted in this election.
    function vote(uint256 electionId, uint256 candidateId) external {
        require(voterRegistry.isRegistered(msg.sender), "Voting: not an authorized voter");
        require(electionManager.isElectionOpen(electionId), "Voting: election not open");
        require(!_hasVoted[electionId][msg.sender], "Voting: already voted");
        require(
            candidateId < electionManager.candidateCount(electionId),
            "Voting: invalid candidate"
        );

        _hasVoted[electionId][msg.sender] = true;
        _voteCounts[electionId][candidateId] += 1;
        totalVotes[electionId] += 1;

        emit VoteCast(electionId, msg.sender, candidateId);
    }

    function hasVoted(uint256 electionId, address voter) external view returns (bool) {
        return _hasVoted[electionId][voter];
    }

    function votesFor(uint256 electionId, uint256 candidateId) external view returns (uint256) {
        return _voteCounts[electionId][candidateId];
    }
}

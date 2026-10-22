// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ElectionManager.sol";
import "./Voting.sol";

/// @title Results
/// @notice Computes and publishes election results after voting has closed.
/// @dev Results are derived on-the-fly from Voting's vote counts; nothing here
/// can be queried before the election's end time to avoid implying a result
/// before the scrutin is actually closed.
contract Results {
    ElectionManager public immutable electionManager;
    Voting public immutable voting;

    event ResultsPublished(uint256 indexed electionId, uint256 winningCandidateId, uint256 winningVoteCount);

    mapping(uint256 => bool) public published;

    modifier onlyAfterClose(uint256 electionId) {
        require(electionManager.hasElectionEnded(electionId), "Results: election still open");
        _;
    }

    constructor(address electionManagerAddress, address votingAddress) {
        electionManager = ElectionManager(electionManagerAddress);
        voting = Voting(votingAddress);
    }

    /// @notice Returns vote counts for every candidate of a closed election.
    function getResults(uint256 electionId)
        external
        view
        onlyAfterClose(electionId)
        returns (string[] memory candidateNames, uint256[] memory voteCounts)
    {
        candidateNames = electionManager.getCandidates(electionId);
        voteCounts = new uint256[](candidateNames.length);
        for (uint256 i = 0; i < candidateNames.length; i++) {
            voteCounts[i] = voting.votesFor(electionId, i);
        }
    }

    /// @notice Returns the winning candidate index, name and vote count.
    /// @dev Reverts if there is a tie, since a single winner cannot be determined.
    function getWinner(uint256 electionId)
        external
        view
        onlyAfterClose(electionId)
        returns (uint256 winningCandidateId, string memory winningName, uint256 winningVoteCount)
    {
        string[] memory candidateNames = electionManager.getCandidates(electionId);
        require(candidateNames.length > 0, "Results: no candidates");

        uint256 bestId = 0;
        uint256 bestVotes = voting.votesFor(electionId, 0);
        bool tie = false;

        for (uint256 i = 1; i < candidateNames.length; i++) {
            uint256 votes = voting.votesFor(electionId, i);
            if (votes > bestVotes) {
                bestVotes = votes;
                bestId = i;
                tie = false;
            } else if (votes == bestVotes) {
                tie = true;
            }
        }

        require(!tie || bestVotes == 0, "Results: election ended in a tie");
        return (bestId, candidateNames[bestId], bestVotes);
    }

    /// @notice Emits a ResultsPublished event for off-chain indexers/UIs.
    /// @dev Anyone may call this once the election is closed; it does not change
    /// the result, only records that it has been formally published on-chain.
    function publishResults(uint256 electionId) external onlyAfterClose(electionId) {
        require(!published[electionId], "Results: already published");
        published[electionId] = true;

        string[] memory candidateNames = electionManager.getCandidates(electionId);
        uint256 bestId = 0;
        uint256 bestVotes = voting.votesFor(electionId, 0);
        for (uint256 i = 1; i < candidateNames.length; i++) {
            uint256 votes = voting.votesFor(electionId, i);
            if (votes > bestVotes) {
                bestVotes = votes;
                bestId = i;
            }
        }

        emit ResultsPublished(electionId, bestId, bestVotes);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ElectionManager
/// @notice Creates elections, defines candidates, and manages opening/closing dates.
contract ElectionManager {
    struct Election {
        string name;
        string[] candidateNames;
        uint256 startTime;
        uint256 endTime;
        bool exists;
    }

    address public admin;
    uint256 public electionCount;
    mapping(uint256 => Election) private _elections;

    event ElectionCreated(
        uint256 indexed electionId,
        string name,
        uint256 candidateCount,
        uint256 startTime,
        uint256 endTime
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "ElectionManager: caller is not admin");
        _;
    }

    modifier electionExists(uint256 electionId) {
        require(_elections[electionId].exists, "ElectionManager: unknown election");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Creates a new election with a fixed candidate list and voting window.
    function createElection(
        string calldata name,
        string[] calldata candidateNames,
        uint256 startTime,
        uint256 endTime
    ) external onlyAdmin returns (uint256 electionId) {
        require(bytes(name).length > 0, "ElectionManager: empty name");
        require(candidateNames.length >= 2, "ElectionManager: need at least 2 candidates");
        require(endTime > startTime, "ElectionManager: endTime before startTime");
        require(endTime > block.timestamp, "ElectionManager: endTime in the past");

        electionId = electionCount;
        Election storage election = _elections[electionId];
        election.name = name;
        election.startTime = startTime;
        election.endTime = endTime;
        election.exists = true;
        for (uint256 i = 0; i < candidateNames.length; i++) {
            require(bytes(candidateNames[i]).length > 0, "ElectionManager: empty candidate name");
            election.candidateNames.push(candidateNames[i]);
        }

        electionCount += 1;
        emit ElectionCreated(electionId, name, candidateNames.length, startTime, endTime);
    }

    function getElection(uint256 electionId)
        external
        view
        electionExists(electionId)
        returns (
            string memory name,
            string[] memory candidateNames,
            uint256 startTime,
            uint256 endTime
        )
    {
        Election storage election = _elections[electionId];
        return (election.name, election.candidateNames, election.startTime, election.endTime);
    }

    function getCandidates(uint256 electionId)
        external
        view
        electionExists(electionId)
        returns (string[] memory)
    {
        return _elections[electionId].candidateNames;
    }

    function candidateCount(uint256 electionId)
        external
        view
        electionExists(electionId)
        returns (uint256)
    {
        return _elections[electionId].candidateNames.length;
    }

    function isElectionOpen(uint256 electionId)
        external
        view
        electionExists(electionId)
        returns (bool)
    {
        Election storage election = _elections[electionId];
        return block.timestamp >= election.startTime && block.timestamp < election.endTime;
    }

    function hasElectionEnded(uint256 electionId)
        external
        view
        electionExists(electionId)
        returns (bool)
    {
        return block.timestamp >= _elections[electionId].endTime;
    }

    function electionExistsPublic(uint256 electionId) external view returns (bool) {
        return _elections[electionId].exists;
    }
}

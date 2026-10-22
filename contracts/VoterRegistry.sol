// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title VoterRegistry
/// @notice Maintains the list of addresses authorized to vote across elections.
contract VoterRegistry {
    address public admin;

    mapping(address => bool) private _registered;
    uint256 public voterCount;

    event VoterRegistered(address indexed voter);
    event VoterRemoved(address indexed voter);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    modifier onlyAdmin() {
        require(msg.sender == admin, "VoterRegistry: caller is not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Registers a single voter address.
    function registerVoter(address voter) external onlyAdmin {
        _registerVoter(voter);
    }

    /// @notice Registers multiple voter addresses in one transaction.
    function registerVoters(address[] calldata voters) external onlyAdmin {
        for (uint256 i = 0; i < voters.length; i++) {
            _registerVoter(voters[i]);
        }
    }

    /// @notice Revokes a voter's authorization.
    function removeVoter(address voter) external onlyAdmin {
        require(_registered[voter], "VoterRegistry: voter not registered");
        _registered[voter] = false;
        voterCount -= 1;
        emit VoterRemoved(voter);
    }

    /// @notice Transfers admin rights to a new address.
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "VoterRegistry: zero address");
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }

    function isRegistered(address voter) external view returns (bool) {
        return _registered[voter];
    }

    function _registerVoter(address voter) private {
        require(voter != address(0), "VoterRegistry: zero address");
        require(!_registered[voter], "VoterRegistry: already registered");
        _registered[voter] = true;
        voterCount += 1;
        emit VoterRegistered(voter);
    }
}

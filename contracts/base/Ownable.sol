// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract Ownable {
    event OwnerUpdated(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NewOwnerZeroAddress();

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function _checkOwner() internal view virtual {
        if (owner != msg.sender) revert NotOwner();
    }

    function setOwner(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert NewOwnerZeroAddress();
        emit OwnerUpdated(owner, newOwner);
        owner = newOwner;
    }
}

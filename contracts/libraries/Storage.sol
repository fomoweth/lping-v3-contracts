// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../types/DataTypes.sol";

library Storage {
    error NotOwner();

    bytes32 private constant pointer = keccak256("Client-Storage-Slot");

    function get() internal pure returns (Slot storage s) {
        bytes32 ptr = pointer;

        assembly {
            s.slot := ptr
        }
    }
}

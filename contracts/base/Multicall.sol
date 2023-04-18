// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IMulticall.sol";
import "../libraries/RevertMessage.sol";

abstract contract Multicall is IMulticall {
    function multicall(
        bytes[] calldata calls
    ) public payable returns (bytes[] memory returnData) {
        uint256 length = calls.length;
        returnData = new bytes[](length);

        for (uint256 i; i < length; ) {
            bool success;

            (success, returnData[i]) = address(this).delegatecall(calls[i]);

            if (!success) revert(RevertMessage.get(returnData[i]));

            unchecked {
                i = i + 1;
            }
        }
    }
}

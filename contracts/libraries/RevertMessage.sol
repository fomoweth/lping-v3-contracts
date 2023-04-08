// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library RevertMessage {
    function get(
        bytes memory returnData
    ) internal pure returns (string memory) {
        if (returnData.length < 68) return "tx reverted silently";

        assembly {
            returnData := add(returnData, 0x04)
        }

        return abi.decode(returnData, (string));
    }
}

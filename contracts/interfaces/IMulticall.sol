// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMulticall {
    function multicall(
        bytes[] memory calls
    ) external payable returns (bytes[] memory returnData);
}

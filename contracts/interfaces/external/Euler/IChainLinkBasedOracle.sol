// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IChainLinkBasedOracle {
    function underlyingUSDChainlinkAggregator() external view returns (address);

    function ETHUSDChainlinkAggregator() external view returns (address);

    function decimals() external view returns (uint8);

    function description() external view returns (string memory);

    function latestAnswer() external view returns (int256);

    function latestTimestamp() external view returns (uint256);
}

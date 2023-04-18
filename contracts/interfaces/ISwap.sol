// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IAdapter.sol";

interface ISwap is IAdapter {
    function swap(
        address pool,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address recipient
    ) external payable returns (uint256 amountOut);
}

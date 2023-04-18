// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDexAggregator {
    struct Route {
        uint256 adapterId;
        address pool;
        address tokenIn;
        address tokenOut;
    }

    function swap(
        Route[] memory routes,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external payable returns (uint256 amountOut);
}

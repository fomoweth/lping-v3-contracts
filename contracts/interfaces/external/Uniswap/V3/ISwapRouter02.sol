// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ISwapRouter.sol";

interface ISwapRouter02 is ISwapRouter {
    // IImmutableState

    function factoryV2() external view returns (address);

    function positionManager() external view returns (address);

    // IApproveAndCall

    enum ApprovalType {
        NOT_REQUIRED,
        MAX,
        MAX_MINUS_ONE,
        ZERO_THEN_MAX,
        ZERO_THEN_MAX_MINUS_ONE
    }

    function getApprovalType(
        address token,
        uint256 amount
    ) external returns (ApprovalType);

    function approveMax(address token) external payable;

    function approveMaxMinusOne(address token) external payable;

    function approveZeroThenMax(address token) external payable;

    function approveZeroThenMaxMinusOne(address token) external payable;

    function callPositionManager(
        bytes memory data
    ) external payable returns (bytes memory result);

    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
    }

    function mint(
        MintParams calldata params
    ) external payable returns (bytes memory result);

    struct IncreaseLiquidityParams {
        address token0;
        address token1;
        uint256 tokenId;
        uint256 amount0Min;
        uint256 amount1Min;
    }

    function increaseLiquidity(
        IncreaseLiquidityParams calldata params
    ) external payable returns (bytes memory result);

    // IV2SwapRouter

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to
    ) external payable returns (uint256 amountOut);

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to
    ) external payable returns (uint256 amountIn);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../types/DataTypes.sol";

interface INFTForwarder {
    struct MintParams {
        Assumption assumption;
        Duration duration;
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        uint32 deadline;
        bool useEth;
    }

    struct ModifyPositionParams {
        uint256 tokenId;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        uint32 deadline;
    }

    function mint(
        MintParams memory params
    )
        external
        payable
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        );

    function addLiquidity(
        ModifyPositionParams memory params
    )
        external
        payable
        returns (uint128 liquidity, uint256 amount0, uint256 amount1);

    function removeLiquidity(
        ModifyPositionParams memory params
    )
        external
        payable
        returns (uint128 liquidity, uint256 amount0, uint256 amount1);

    function collect(
        uint256 tokenId
    ) external payable returns (uint256 amount0, uint256 amount1);

    function burn(
        uint256 tokenId
    ) external payable returns (uint256 amount0, uint256 amount1);
}

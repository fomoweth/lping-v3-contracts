// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/external/Uniswap/V2/IUniswapV2Factory.sol";
import "../interfaces/external/Uniswap/V2/IUniswapV2Pair.sol";
import "../interfaces/ISwap.sol";
import "../libraries/TransferHelper.sol";
import "../base/Payments.sol";

contract V2Swap is ISwap, Payments {
    using TransferHelper for address;

    error InsufficientAmountOut();

    uint256 public immutable id;

    constructor(address _weth, uint256 _id) Payments(_weth) {
        id = _id;
    }

    function swap(
        address pair,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address recipient
    ) external payable returns (uint256 amountOut) {
        if (tokenIn.isNative()) {
            tokenIn = WETH;
        }

        pay(tokenIn, msg.sender, pair, amountIn);

        amountOut = quote(pair, tokenIn, tokenOut, amountIn);

        (uint256 amountOut0, uint256 amountOut1) = tokenIn < tokenOut
            ? (uint256(0), amountOut)
            : (amountOut, uint256(0));

        IUniswapV2Pair(pair).swap(
            amountOut0,
            amountOut1,
            recipient,
            new bytes(0)
        );
    }

    function quote(
        address pair,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) private view returns (uint256 amountOut) {
        (uint256 reserveIn, uint256 reserveOut, ) = IUniswapV2Pair(pair)
            .getReserves();

        if (tokenIn > tokenOut) {
            (reserveIn, reserveOut) = (reserveOut, reserveIn);
        }

        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }
}

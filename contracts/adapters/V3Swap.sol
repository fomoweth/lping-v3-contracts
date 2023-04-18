// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/external/Uniswap/V3/IUniswapV3Callback.sol";
import "../interfaces/external/Uniswap/V3/IUniswapV3Pool.sol";
import "../interfaces/ISwap.sol";
import "../libraries/Path.sol";
import "../libraries/PoolAddress.sol";
import "../libraries/SafeCast.sol";
import "../libraries/TickMath.sol";
import "../libraries/TransferHelper.sol";
import "../base/Payments.sol";

contract V3Swap is ISwap, IUniswapV3SwapCallback, Payments {
    using Path for bytes;
    using TransferHelper for address;

    error InvalidPool();

    address private immutable UNISWAP_V3_FACTORY;
    uint256 public immutable id;
    uint256 private constant DEFAULT_SLIPPAGE = 30; // 0.3%

    constructor(
        address _v3Factory,
        address _weth,
        uint256 _id
    ) Payments(_weth) {
        UNISWAP_V3_FACTORY = _v3Factory;
        id = _id;
    }

    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) external {
        require(amount0Delta > 0 || amount1Delta > 0);

        (bytes memory path, address payer) = abi.decode(data, (bytes, address));

        (address tokenIn, address tokenOut, uint24 fee) = path
            .decodeFirstPool();

        if (
            msg.sender !=
            PoolAddress.computeAddress(
                UNISWAP_V3_FACTORY,
                tokenIn,
                tokenOut,
                fee
            )
        ) revert InvalidPool();

        uint256 amountToPay = amount0Delta > 0
            ? uint256(amount0Delta)
            : uint256(amount1Delta);

        pay(tokenIn, payer, msg.sender, amountToPay);
    }

    function swap(
        address pool,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address recipient
    ) external payable returns (uint256 amountOut) {
        if (tokenIn.isNative()) {
            tokenIn = WETH;
        }

        bool zeroForOne = tokenIn < tokenOut;

        (int256 amount0Delta, int256 amount1Delta) = IUniswapV3Pool(pool).swap(
            recipient,
            zeroForOne,
            SafeCast.toInt256(amountIn),
            zeroForOne
                ? TickMath.MIN_SQRT_RATIO + 1
                : TickMath.MAX_SQRT_RATIO - 1,
            abi.encode(
                abi.encodePacked(tokenIn, IUniswapV3Pool(pool).fee(), tokenOut),
                msg.sender
            )
        );

        amountOut = uint256(-(zeroForOne ? amount1Delta : amount0Delta));
    }
}

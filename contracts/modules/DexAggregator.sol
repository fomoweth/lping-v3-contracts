// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IDexAggregator.sol";
import "../interfaces/IRegistry.sol";
import "../interfaces/ISwap.sol";
import "../libraries/Storage.sol";
import "../libraries/TransferHelper.sol";
import "../base/Deadline.sol";
import "../base/Forwarder.sol";

contract DexAggregator is IDexAggregator, Deadline, Forwarder {
    using TransferHelper for address;

    error InsufficientAmountOut();
    error InvalidAdapterType();

    IRegistry private immutable registry;

    uint256 private constant SWAP_ADAPTER_TYPE = 1;

    constructor(IRegistry _registry) {
        registry = _registry;
    }

    function swap(
        Route[] memory routes,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external payable checkDeadline(deadline) returns (uint256 amountOut) {
        Storage.checkOwner(msg.sender);

        uint256 length = routes.length;

        for (uint256 i; i < length; ) {
            amountIn = _swap(routes[i], amountIn, routes[i].tokenIn.isNative());

            unchecked {
                i = i + 1;
            }
        }

        amountOut = amountIn;

        if (amountOut < amountOutMin) revert InsufficientAmountOut();
    }

    function _swap(
        Route memory route,
        uint256 amountIn,
        bool useEth
    ) private returns (uint256 amountOut) {
        address adapterAddress = _getAdapter(route.adapterId);

        if (!useEth) {
            route.tokenIn.tryApprove(adapterAddress, amountIn);
        }

        bytes memory returnData = forward(
            Operation.CALL,
            adapterAddress,
            abi.encodeWithSelector(
                ISwap.swap.selector,
                route.pool,
                route.tokenIn,
                route.tokenOut,
                amountIn,
                address(this)
            ),
            !useEth ? 0 : amountIn
        );

        amountOut = abi.decode(returnData, (uint256));
    }

    function _getAdapter(uint256 adapterId) private view returns (address) {
        IRegistry.AdapterConfig memory adapterConfig = registry.getAdapter(
            adapterId
        );

        if (adapterConfig.adapterType != SWAP_ADAPTER_TYPE) {
            revert InvalidAdapterType();
        }

        return adapterConfig.adapterAddress;
    }
}

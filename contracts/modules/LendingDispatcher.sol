// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/ILender.sol";
import "../interfaces/ILendingDispatcher.sol";
import "../interfaces/IRegistry.sol";
import "../libraries/Storage.sol";
import "../base/Forwarder.sol";

contract LendingDispatcher is ILendingDispatcher, Forwarder {
    error InvalidAdapterType();

    IRegistry private immutable registry;

    uint256 private constant LENDER_ADAPTER_TYPE = 2;

    constructor(IRegistry _registry) {
        registry = _registry;
    }

    function supplyAndBorrow(
        uint256 adapterId,
        address collateralToken,
        address debtToken,
        uint256 collateralAmount,
        uint256 borrowAmount
    ) external payable {
        Storage.checkOwner(msg.sender);

        forward(
            Operation.DELEGATECALL,
            _getAdapter(adapterId),
            abi.encodeWithSelector(
                ILender.supplyAndBorrow.selector,
                collateralToken,
                debtToken,
                collateralAmount,
                borrowAmount
            ),
            0
        );
    }

    function repayAndRedeem(
        uint256 adapterId,
        address collateralToken,
        address debtToken,
        uint256 repayAmount,
        uint256 redeemAmount
    ) external payable {
        Storage.checkOwner(msg.sender);

        forward(
            Operation.DELEGATECALL,
            _getAdapter(adapterId),
            abi.encodeWithSelector(
                ILender.repayAndRedeem.selector,
                collateralToken,
                debtToken,
                repayAmount,
                redeemAmount
            ),
            0
        );
    }

    function supply(
        uint256 adapterId,
        address token,
        uint256 amount
    ) external payable {
        Storage.checkOwner(msg.sender);

        forward(
            Operation.DELEGATECALL,
            _getAdapter(adapterId),
            abi.encodeWithSelector(ILender.supply.selector, token, amount),
            0
        );
    }

    function borrow(
        uint256 adapterId,
        address token,
        uint256 amount
    ) external payable {
        Storage.checkOwner(msg.sender);

        forward(
            Operation.DELEGATECALL,
            _getAdapter(adapterId),
            abi.encodeWithSelector(ILender.borrow.selector, token, amount),
            0
        );
    }

    function repay(
        uint256 adapterId,
        address token,
        uint256 amount
    ) external payable {
        Storage.checkOwner(msg.sender);

        forward(
            Operation.DELEGATECALL,
            _getAdapter(adapterId),
            abi.encodeWithSelector(ILender.repay.selector, token, amount),
            0
        );
    }

    function redeem(
        uint256 adapterId,
        address token,
        uint256 amount
    ) external payable {
        Storage.checkOwner(msg.sender);

        forward(
            Operation.DELEGATECALL,
            _getAdapter(adapterId),
            abi.encodeWithSelector(ILender.redeem.selector, token, amount),
            0
        );
    }

    function _getAdapter(uint256 adapterId) private view returns (address) {
        IRegistry.AdapterConfig memory adapterConfig = registry.getAdapter(
            adapterId
        );

        if (adapterConfig.adapterType != LENDER_ADAPTER_TYPE) {
            revert InvalidAdapterType();
        }

        return adapterConfig.adapterAddress;
    }
}

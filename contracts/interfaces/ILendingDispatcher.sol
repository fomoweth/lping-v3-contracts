// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ILendingDispatcher {
    function supplyAndBorrow(
        uint256 adapterId,
        address collateralToken,
        address debtToken,
        uint256 collateralAmount,
        uint256 borrowAmount
    ) external payable;

    function repayAndRedeem(
        uint256 adapterId,
        address collateralToken,
        address debtToken,
        uint256 repayAmount,
        uint256 redeemAmount
    ) external payable;

    function supply(
        uint256 adapterId,
        address token,
        uint256 amount
    ) external payable;

    function borrow(
        uint256 adapterId,
        address token,
        uint256 amount
    ) external payable;

    function repay(
        uint256 adapterId,
        address token,
        uint256 amount
    ) external payable;

    function redeem(
        uint256 adapterId,
        address token,
        uint256 amount
    ) external payable;
}

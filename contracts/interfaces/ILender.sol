// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IAdapter.sol";

interface ILender is IAdapter {
    function supplyAndBorrow(
        address collateralAsset,
        address borrowAsset,
        uint256 supplyAmount,
        uint256 borrowAmount
    ) external payable;

    function repayAndRedeem(
        address collateralAsset,
        address borrowAsset,
        uint256 repayAmount,
        uint256 redeemAmount
    ) external payable;

    function supply(address market, uint256 amount) external payable;

    function borrow(address market, uint256 amount) external payable;

    function repay(address market, uint256 amount) external payable;

    function redeem(address market, uint256 amount) external payable;

    function getEnteredMarkets(
        address account
    ) external view returns (address[] memory enteredMarkets);

    function getAccountLiquidity(
        address account
    )
        external
        view
        returns (
            uint256 collateralValue,
            uint256 liabilityValue,
            uint256 healthFactor
        );

    function getSupplyBalance(
        address token,
        address account
    ) external view returns (uint256 supplyBalance);

    function getBorrowBalance(
        address token,
        address account
    ) external view returns (uint256 borrowBalance);
}

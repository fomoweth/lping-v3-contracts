// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/external/Euler/IMarkets.sol";
import "../interfaces/external/Euler/IEulerGeneralView.sol";
import "../interfaces/external/Euler/IEulerSimpleLens.sol";
import "../interfaces/external/Euler/IEToken.sol";
import "../interfaces/external/Euler/IDToken.sol";
import "../interfaces/ILender.sol";
import "../libraries/FullMath.sol";
import "../libraries/TransferHelper.sol";

contract EulerAdapter is ILender {
    using TransferHelper for address;

    error NotCollateral();

    uint32 private constant COLLATERAL_FACTOR_SCALE = 10000;
    uint32 private constant EULER_FACTOR_SCALE = 400000;

    address private immutable euler;
    IMarkets private immutable markets;
    IEulerSimpleLens private immutable lens;
    address private immutable WETH;

    uint256 public immutable id;

    constructor(
        address _euler,
        IMarkets _markets,
        IEulerSimpleLens _lens,
        address _weth,
        uint256 _id
    ) {
        euler = _euler;
        markets = _markets;
        lens = _lens;
        WETH = _weth;
        id = _id;
    }

    modifier isCollateral(address token) {
        validateCollateral(token);
        _;
    }

    function supplyAndBorrow(
        address collateralAsset,
        address borrowAsset,
        uint256 supplyAmount,
        uint256 borrowAmount
    ) public payable isCollateral(collateralAsset) {
        supply(collateralAsset, supplyAmount);
        borrow(borrowAsset, borrowAmount);
    }

    function repayAndRedeem(
        address collateralAsset,
        address borrowAsset,
        uint256 repayAmount,
        uint256 redeemAmount
    ) public payable isCollateral(collateralAsset) {
        repay(borrowAsset, repayAmount);
        redeem(collateralAsset, redeemAmount);
    }

    function supply(address token, uint256 amount) public payable {
        token.tryApprove(euler, amount);

        getEToken(token).deposit(0, amount);

        if (!isMarketEntered(token)) {
            markets.enterMarket(0, token);
        }
    }

    function borrow(address token, uint256 amount) public payable {
        getDToken(token).borrow(0, amount);
    }

    function repay(address token, uint256 amount) public payable {
        token.tryApprove(euler, amount);

        getDToken(token).repay(0, amount);
    }

    function redeem(address token, uint256 amount) public payable {
        getEToken(token).withdraw(0, amount);
    }

    function getEnteredMarkets(
        address account
    ) public view returns (address[] memory enteredMarkets) {
        return markets.getEnteredMarkets(account);
    }

    function getAccountLiquidity(
        address account
    )
        external
        view
        returns (
            uint256 collateralValue,
            uint256 liabilityValue,
            uint256 healthFactor
        )
    {
        (collateralValue, liabilityValue, ) = lens.getAccountStatus(account);

        if (collateralValue != 0) {
            healthFactor =
                FullMath.wadDiv(liabilityValue, collateralValue) /
                1e14;
        }
    }

    function getSupplyBalance(
        address eToken,
        address account
    ) public view returns (uint256 supplyBalance) {
        return IEToken(eToken).balanceOfUnderlying(account);
    }

    function getBorrowBalance(
        address dToken,
        address account
    ) public view returns (uint256 borrowBalance) {
        return dToken.getBalance(account);
    }

    function getAssetConfig(
        address token
    )
        private
        view
        returns (
            uint32 collateralFactor,
            uint32 borrowFactor,
            uint24 twapWindow,
            uint256 underlyingPrice,
            uint256 unit,
            bool borrowIsolated
        )
    {
        IEuler.AssetConfig memory assetConfig = markets.underlyingToAssetConfig(
            token
        );

        borrowIsolated = assetConfig.borrowIsolated;
        collateralFactor = assetConfig.collateralFactor / EULER_FACTOR_SCALE;
        borrowFactor = assetConfig.borrowFactor / EULER_FACTOR_SCALE;
        twapWindow = assetConfig.twapWindow;
        (, , underlyingPrice) = lens.getPriceFull(token);
        unit = token.getDecimals();
    }

    function getDToken(address token) private view returns (IDToken dToken) {
        return IDToken(getDTokenAddress(token));
    }

    function getEToken(address token) private view returns (IEToken eToken) {
        return IEToken(getETokenAddress(token));
    }

    function getDTokenAddress(
        address token
    ) private view returns (address dToken) {
        return markets.underlyingToDToken(token);
    }

    function getETokenAddress(
        address token
    ) private view returns (address eToken) {
        return markets.underlyingToEToken(token);
    }

    function isMarketEntered(address token) private view returns (bool) {
        address[] memory enteredMarkets = getEnteredMarkets(address(this));
        uint256 length = enteredMarkets.length;

        if (length == 0) return false;

        for (uint256 i; i < length; ) {
            if (enteredMarkets[i] == token) return true;

            unchecked {
                i = i + 1;
            }
        }

        return false;
    }

    function validateCollateral(address token) private view {
        if (
            markets.underlyingToAssetConfig(token).collateralFactor /
                EULER_FACTOR_SCALE ==
            0
        ) revert NotCollateral();
    }
}

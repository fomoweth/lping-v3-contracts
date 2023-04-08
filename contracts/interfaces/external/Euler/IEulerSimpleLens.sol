// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IEuler.sol";

interface IEulerSimpleLens {
    struct AssetConfig {
        address eTokenAddress;
        bool borrowIsolated;
        uint32 collateralFactor;
        uint32 borrowFactor;
        uint24 twapWindow;
    }

    function euler() external view returns (address);

    function markets() external view returns (address);

    function exec() external view returns (address);

    function underlyingToEToken(
        address underlying
    ) external view returns (address eToken);

    function underlyingToDToken(
        address underlying
    ) external view returns (address dToken);

    function underlyingToPToken(
        address underlying
    ) external view returns (address pToken);

    function underlyingToInternalTokens(
        address underlying
    ) external view returns (address eToken, address dToken, address pToken);

    function underlyingToAssetConfig(
        address underlying
    ) external view returns (IEuler.AssetConfig memory config);

    function interestRateModel(address underlying) external view returns (uint);

    function interestRates(
        address underlying
    ) external view returns (uint borrowSPY, uint borrowAPY, uint supplyAPY);

    function interestAccumulator(
        address underlying
    ) external view returns (uint);

    function reserveFee(address underlying) external view returns (uint32);

    function getPricingConfig(
        address underlying
    )
        external
        view
        returns (
            uint16 pricingType,
            uint32 pricingParameters,
            address pricingForwarded
        );

    function getEnteredMarkets(
        address account
    ) external view returns (address[] memory);

    function getAccountStatus(
        address account
    )
        external
        view
        returns (uint collateralValue, uint liabilityValue, uint healthScore);

    function getPriceFull(
        address underlying
    ) external view returns (uint twap, uint twapPeriod, uint currPrice);

    function getPTokenBalance(
        address underlying,
        address account
    ) external view returns (uint256);

    function getDTokenBalance(
        address underlying,
        address account
    ) external view returns (uint256);

    function getETokenBalance(
        address underlying,
        address account
    ) external view returns (uint256);

    function getEulerAccountAllowance(
        address underlying,
        address account
    ) external view returns (uint256);

    function getTotalSupplyAndDebts(
        address underlying
    )
        external
        view
        returns (
            uint poolSize,
            uint totalBalances,
            uint totalBorrows,
            uint reserveBalance
        );

    function getTokenInfo(
        address underlying
    ) external view returns (string memory name, string memory symbol);

    struct ResponseIRM {
        uint kink;
        uint baseAPY;
        uint kinkAPY;
        uint maxAPY;
        uint baseSupplyAPY;
        uint kinkSupplyAPY;
        uint maxSupplyAPY;
    }

    function irmSettings(
        address underlying
    ) external view returns (ResponseIRM memory r);
}

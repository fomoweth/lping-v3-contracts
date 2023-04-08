// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IEuler.sol";

interface IMarkets {
    function activateMarket(address underlying) external returns (address);

    function activatePToken(address underlying) external returns (address);

    function underlyingToEToken(
        address underlying
    ) external view returns (address);

    function underlyingToDToken(
        address underlying
    ) external view returns (address);

    function underlyingToPToken(
        address underlying
    ) external view returns (address);

    function underlyingToAssetConfig(
        address underlying
    ) external view returns (IEuler.AssetConfig memory);

    function underlyingToAssetConfigUnresolved(
        address underlying
    ) external view returns (IEuler.AssetConfig memory config);

    function eTokenToUnderlying(
        address eToken
    ) external view returns (address underlying);

    function dTokenToUnderlying(
        address dToken
    ) external view returns (address underlying);

    function eTokenToDToken(
        address eToken
    ) external view returns (address dTokenAddr);

    function interestRateModel(address underlying) external view returns (uint);

    function interestRate(address underlying) external view returns (int96);

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

    function getChainlinkPriceFeedConfig(
        address underlying
    ) external view returns (address chainlinkAggregator);

    function getEnteredMarkets(
        address account
    ) external view returns (address[] memory);

    function enterMarket(uint subAccountId, address newMarket) external;

    function exitMarket(uint subAccountId, address oldMarket) external;
}

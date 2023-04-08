// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IEuler.sol";

interface IEulerGeneralView {
    struct LiquidityStatus {
        uint256 collateralValue;
        uint256 liabilityValue;
        uint256 numBorrows;
        bool borrowIsolated;
    }

    struct AssetLiquidity {
        address underlying;
        LiquidityStatus status;
    }

    struct Query {
        address eulerContract;
        address account;
        address[] markets;
    }

    struct ResponseMarket {
        // Universal
        address underlying;
        string name;
        string symbol;
        uint8 decimals;
        address eTokenAddr;
        address dTokenAddr;
        address pTokenAddr;
        IEuler.AssetConfig config;
        uint poolSize;
        uint totalBalances;
        uint totalBorrows;
        uint reserveBalance;
        uint32 reserveFee;
        uint borrowAPY;
        uint supplyAPY;
        // Pricing
        uint twap;
        uint twapPeriod;
        uint currPrice;
        uint16 pricingType;
        uint32 pricingParameters;
        address pricingForwarded;
        // Account specific
        uint underlyingBalance;
        uint eulerAllowance;
        uint eTokenBalance;
        uint eTokenBalanceUnderlying;
        uint dTokenBalance;
        LiquidityStatus liquidityStatus;
    }

    struct Response {
        uint timestamp;
        uint blockNumber;
        ResponseMarket[] markets;
        address[] enteredMarkets;
    }

    function doQuery(Query memory q) external view returns (Response memory r);

    function doQueryBatch(
        Query[] memory qs
    ) external view returns (Response[] memory r);

    function computeAPYs(
        uint borrowSPY,
        uint totalBorrows,
        uint totalBalancesUnderlying,
        uint32 reserveFee
    ) external pure returns (uint borrowAPY, uint supplyAPY);

    struct QueryIRM {
        address eulerContract;
        address underlying;
    }

    struct ResponseIRM {
        uint kink;
        uint baseAPY;
        uint kinkAPY;
        uint maxAPY;
        uint baseSupplyAPY;
        uint kinkSupplyAPY;
        uint maxSupplyAPY;
    }

    function doQueryIRM(
        QueryIRM memory q
    ) external view returns (ResponseIRM memory r);

    struct ResponseAccountLiquidity {
        AssetLiquidity[] markets;
    }

    function doQueryAccountLiquidity(
        address eulerContract,
        address[] memory addrs
    ) external view returns (ResponseAccountLiquidity[] memory r);
}

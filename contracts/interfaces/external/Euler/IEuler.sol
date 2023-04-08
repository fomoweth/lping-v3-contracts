// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IEuler {
    function moduleIdToImplementation(
        uint moduleId
    ) external view returns (address);

    function moduleIdToProxy(uint moduleId) external view returns (address);

    struct AssetConfig {
        address eTokenAddress;
        bool borrowIsolated;
        uint32 collateralFactor;
        uint32 borrowFactor;
        uint24 twapWindow;
    }
}

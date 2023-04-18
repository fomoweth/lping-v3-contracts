// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRegistry {
    event AddressUpdated(
        bytes32 indexed key,
        address indexed oldAddress,
        address indexed newAddress
    );

    event AdapterUpdated(uint256 indexed id, address indexed adapter);

    struct AdapterConfig {
        uint8 adapterType; // 1: DEX, 2: Lender
        address adapterAddress;
    }

    function WETH() external view returns (address);

    function getAddress(bytes32 key) external view returns (address);

    function getAdapter(
        uint256 id
    ) external view returns (AdapterConfig memory adapterConfig);

    function factory() external view returns (address);

    function moduleManager() external view returns (address);

    function setAddress(bytes32 key, address newAddress) external;

    function setFactory(address newFactory) external;

    function setModuleManager(address newModuleManager) external;

    function setAdapter(
        uint256 id,
        address adapter,
        uint8 adapterType
    ) external;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFactory {
    event RegistryUpdated(
        address indexed oldRegistry,
        address indexed newRegistry
    );

    event ImplementationUpdated(
        address indexed oldImplementation,
        address indexed newImplementation
    );

    event ClientDeployed(address indexed owner, address indexed client);

    function deploy() external returns (address client);

    function computeAddress(
        address account,
        uint256 nonce
    ) external view returns (address client);

    function setRegistry(address newRegistry) external;

    function setImplementation(address newImplementation) external;

    function implementation() external view returns (address);

    function registry() external view returns (address);

    function nonces(address account) external view returns (uint256);

    function clients(
        address account,
        uint256 id
    ) external view returns (address client);
}

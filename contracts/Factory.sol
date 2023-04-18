// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IClient.sol";
import "./interfaces/IFactory.sol";
import "./base/Ownable.sol";

contract Factory is IFactory, Ownable {
    error DeploymentFailed();
    error InitializationFailed();
    error InvalidModuleId();

    mapping(address => mapping(uint256 => address)) public clients;
    mapping(address => uint256) public nonces;

    address public implementation;
    address public registry;

    Module[] private _modules;

    function deploy() external returns (address client) {
        bytes20 targetBytes = bytes20(implementation);
        uint256 nonce = nonces[msg.sender];
        bytes32 salt = keccak256(abi.encodePacked(nonce, msg.sender));

        assembly {
            let ptr := mload(0x40)

            mstore(
                ptr,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )
            mstore(add(ptr, 0x14), targetBytes)
            mstore(
                add(ptr, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )

            client := create2(0, ptr, 0x37, salt)
        }

        if (client == address(0)) revert DeploymentFailed();

        if (!IClient(client).initialize(msg.sender))
            revert InitializationFailed();

        clients[msg.sender][nonce] = client;

        unchecked {
            nonces[msg.sender] = nonce + 1;
        }

        emit ClientDeployed(msg.sender, client);
    }

    function computeAddress(
        address account,
        uint256 nonce
    ) external view returns (address client) {
        address impl = implementation;
        bytes32 salt = keccak256(abi.encodePacked(nonce, account));

        assembly {
            let ptr := mload(0x40)

            mstore(
                ptr,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )
            mstore(add(ptr, 0x14), shl(0x60, impl))
            mstore(
                add(ptr, 0x28),
                0x5af43d82803e903d91602b57fd5bf3ff00000000000000000000000000000000
            )
            mstore(add(ptr, 0x38), shl(0x60, address()))
            mstore(add(ptr, 0x4c), salt)
            mstore(add(ptr, 0x6c), keccak256(ptr, 0x37))

            client := keccak256(add(ptr, 0x37), 0x55)
        }
    }

    function setImplementation(address newImplementation) external onlyOwner {
        emit ImplementationUpdated(implementation, newImplementation);

        implementation = newImplementation;
    }

    function setRegistry(address newRegistry) external onlyOwner {
        emit RegistryUpdated(registry, newRegistry);

        registry = newRegistry;
    }

    function setModule(
        uint256 id,
        address module,
        bytes4[] memory signatures
    ) external onlyOwner {
        if (id == type(uint256).max) {
            // add new module
            _modules.push(Module({module: module, signatures: signatures}));
        } else {
            // update existing module
            if (id > _modules.length - 1) revert InvalidModuleId();

            _modules[id] = Module({module: module, signatures: signatures});
        }
    }

    function getModules(
        uint256[] memory ids
    ) public view returns (Module[] memory modules) {
        if (ids.length == 0) return _modules;

        Module[] memory cached = _modules;
        uint256 total = cached.length - 1;

        uint256 length = ids.length;
        uint256 id;

        modules = new Module[](length);

        for (uint256 i; i < length; ) {
            id = ids[i];

            if (id > total) revert InvalidModuleId();

            modules[i] = cached[id];

            unchecked {
                i = i + 1;
            }
        }
    }
}

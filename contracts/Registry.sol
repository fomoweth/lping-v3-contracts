// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IRegistry.sol";
import "./base/Ownable.sol";

contract Registry is IRegistry, Ownable {
    error InvalidKey();

    mapping(bytes32 => address) private _addresses;
    mapping(uint256 => AdapterConfig) private _adapters;

    address public immutable WETH;

    bytes32 private constant FACTORY = "FACTORY";
    bytes32 private constant MODULE_MANAGER = "MODULE_MANAGER";

    uint256 private nextAdapterId = 1;

    constructor(address weth) {
        WETH = weth;
    }

    function getAddress(bytes32 key) public view returns (address) {
        return _addresses[key];
    }

    function factory() external view returns (address) {
        return getAddress(FACTORY);
    }

    function moduleManager() external view returns (address) {
        return getAddress(MODULE_MANAGER);
    }

    function getAdapter(
        uint256 id
    ) external view returns (AdapterConfig memory adapterConfig) {
        return _adapters[id];
    }

    function setAddress(bytes32 key, address newAddress) public onlyOwner {
        if (key.length == 0) revert InvalidKey();

        address oldAddress = _addresses[key];
        _addresses[key] = newAddress;

        emit AddressUpdated(key, oldAddress, newAddress);
    }

    function setFactory(address newFactory) external onlyOwner {
        setAddress(FACTORY, newFactory);
    }

    function setModuleManager(address newModuleManager) external onlyOwner {
        setAddress(MODULE_MANAGER, newModuleManager);
    }

    function setAdapter(
        uint256 id,
        address adapter,
        uint8 adapterType
    ) external onlyOwner {
        uint256 adapterId = id == 0 ? nextAdapterId++ : id;
        _adapters[adapterId] = AdapterConfig({
            adapterType: adapterType,
            adapterAddress: adapter
        });

        emit AdapterUpdated(adapterId, adapter);
    }
}

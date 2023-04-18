// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../types/DataTypes.sol";

interface IModuleManager {
    function update(Action action, Module[] memory data) external;

    function clear(address module) external;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IModuleManager.sol";
import "../libraries/Storage.sol";

contract ModuleManager {
    error InvalidAction();
    error ModuleExistsAlready();
    error ModuleNotExists();
    error ModuleZeroAddress();

    function update(Action action, Module[] memory modules) external {
        if (uint8(action) > 2) revert InvalidAction();

        Storage.checkOwner(msg.sender);

        Slot storage slot = Storage.get();

        uint256 length = modules.length;

        for (uint256 i; i < length; ) {
            write(slot, action, modules[i].module, modules[i].signatures);

            unchecked {
                i = i + 1;
            }
        }
    }

    function clear(address module) external {
        if (module == address(0)) revert ModuleZeroAddress();

        Storage.checkOwner(msg.sender);

        Slot storage slot = Storage.get();

        bytes4[] memory cached = slot.signatures[module];
        uint256 length = cached.length;

        for (uint256 i; i < length; ) {
            delete slot.modules[cached[i]];

            unchecked {
                i = i + 1;
            }
        }

        delete slot.signatures[module];
    }

    function write(
        Slot storage slot,
        Action action,
        address module,
        bytes4[] memory signatures
    ) private {
        if (module == address(0)) revert ModuleZeroAddress();

        uint256 length = signatures.length;

        for (uint256 i; i < length; ) {
            if (action == Action.Remove) {
                remove(slot, module, signatures[i]);
            } else {
                address prior = slot.modules[signatures[i]];

                if (prior != address(0)) {
                    if (action == Action.Add) {
                        revert ModuleExistsAlready();
                    } else {
                        remove(slot, prior, signatures[i]);
                    }
                }

                add(slot, module, signatures[i]);
            }

            unchecked {
                i = i + 1;
            }
        }
    }

    function add(Slot storage slot, address module, bytes4 signature) private {
        slot.modules[signature] = module;
        slot.signatures[module].push(signature);
    }

    function remove(
        Slot storage slot,
        address module,
        bytes4 signature
    ) private {
        bytes4[] memory cached = slot.signatures[module];
        uint256 length = cached.length;
        uint256 targetIndex = length;

        for (uint256 i; i < length; ) {
            if (cached[i] == signature) {
                targetIndex = i;
                break;
            }

            unchecked {
                i = i + 1;
            }
        }

        if (targetIndex == length) revert ModuleNotExists();

        bytes4[] storage signatures = slot.signatures[module];
        signatures[targetIndex] = signatures[signatures.length - 1];
        signatures.pop();

        delete slot.modules[signature];
    }
}

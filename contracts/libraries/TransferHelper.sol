// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/external/IERC20Metadata.sol";

library TransferHelper {
    error SafeApproveFailed();
    error SafeTransferFailed();
    error SafeTransferNativeFailed();
    error SafeTransferFromFailed();
    error SafeTransferFromNativeFailed();

    bytes4 private constant ALLOWANCE_SIGNATURE = IERC20.allowance.selector;
    bytes4 private constant APPROVE_SIGNATURE = IERC20.approve.selector;
    bytes4 private constant BALANCE_OF_SIGNATURE = IERC20.balanceOf.selector;
    bytes4 private constant TRANSFER_SIGNATURE = IERC20.transfer.selector;
    bytes4 private constant TRANSFER_FROM_SIGNATURE =
        IERC20.transferFrom.selector;

    function safeApprove(
        address token,
        address spender,
        uint256 value
    ) internal {
        if (!_call(token, APPROVE_SIGNATURE, spender, value))
            revert SafeApproveFailed();
    }

    function tryApprove(
        address token,
        address spender,
        uint256 value
    ) internal {
        if (!_call(token, APPROVE_SIGNATURE, spender, value)) {
            if (
                !_call(token, APPROVE_SIGNATURE, spender, 0) ||
                !_call(token, APPROVE_SIGNATURE, spender, value)
            ) {
                revert SafeApproveFailed();
            }
        }
    }

    function safeTransfer(
        address token,
        address recipient,
        uint256 value
    ) internal {
        if (!isNative(token)) {
            if (!_call(token, TRANSFER_SIGNATURE, recipient, value))
                revert SafeTransferFailed();
        } else {
            bool success;

            assembly {
                success := call(gas(), recipient, value, 0, 0, 0, 0)
            }

            if (!success) revert SafeTransferNativeFailed();
        }
    }

    function safeTransferFrom(
        address token,
        address owner,
        address recipient,
        uint256 value
    ) internal {
        if (!isNative(token)) {
            bytes4 selector = TRANSFER_FROM_SIGNATURE;
            bool success;

            assembly {
                let ptr := mload(0x40)

                mstore(ptr, selector)
                mstore(add(ptr, 0x04), owner)
                mstore(add(ptr, 0x24), recipient)
                mstore(add(ptr, 0x44), value)

                success := call(gas(), token, 0, ptr, 100, 0x0, 0x20)

                if success {
                    switch returndatasize()
                    case 0 {
                        success := gt(extcodesize(token), 0)
                    }
                    default {
                        success := and(
                            gt(returndatasize(), 31),
                            eq(mload(0), 1)
                        )
                    }
                }
            }

            if (!success) revert SafeTransferFromFailed();
        } else {
            if (msg.value != value) revert SafeTransferFromNativeFailed();
        }
    }

    function _call(
        address token,
        bytes4 selector,
        address target,
        uint256 value
    ) private returns (bool success) {
        assembly {
            let ptr := mload(0x40)

            mstore(ptr, selector)
            mstore(add(ptr, 0x04), target)
            mstore(add(ptr, 0x24), value)

            success := call(gas(), token, 0, ptr, 0x44, 0x0, 0x20)

            if success {
                switch returndatasize()
                case 0 {
                    success := gt(extcodesize(token), 0)
                }
                default {
                    success := and(gt(returndatasize(), 31), eq(mload(0), 1))
                }
            }
        }
    }

    function getAllowance(
        address token,
        address owner,
        address spender
    ) internal view returns (uint256 value) {
        if (isNative(token)) return type(uint256).max;

        bytes4 selector = ALLOWANCE_SIGNATURE;

        assembly {
            let ptr := mload(0x40)

            mstore(ptr, selector)
            mstore(add(ptr, 0x4), owner)
            mstore(add(ptr, 0x24), spender)

            if iszero(staticcall(gas(), token, ptr, 0x44, 0x0, 0x20)) {
                revert(0, 0)
            }

            value := mload(0)
        }
    }

    function getBalance(
        address token,
        address account
    ) internal view returns (uint256 value) {
        if (isNative(token)) return account.balance;

        bytes4 selector = BALANCE_OF_SIGNATURE;

        assembly {
            let ptr := mload(0x40)

            mstore(ptr, selector)
            mstore(add(ptr, 0x4), account)

            if iszero(staticcall(gas(), token, ptr, 0x24, 0x0, 0x20)) {
                revert(0, 0)
            }

            value := mload(0)
        }
    }

    function getDecimals(address token) internal view returns (uint8 value) {
        assembly {
            let ptr := mload(0x40)

            mstore(ptr, 0x313ce567)

            if iszero(staticcall(gas(), token, ptr, 0x4, 0, 0x20)) {
                revert(0, 0)
            }

            value := mload(0)
        }
    }

    function isNative(address token) internal pure returns (bool) {
        return token == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    }

    function isZeroAddress(address token) internal pure returns (bool) {
        return token == address(0);
    }
}

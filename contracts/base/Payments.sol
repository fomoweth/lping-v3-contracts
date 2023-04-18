// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/TransferHelper.sol";
import "../libraries/Wrapper.sol";

abstract contract Payments {
    using TransferHelper for address;

    address internal immutable WETH;

    constructor(address _weth) {
        WETH = _weth;
    }

    function pay(
        address token,
        address payer,
        address recipient,
        uint256 value
    ) internal {
        if (token == WETH && address(this).balance >= value) {
            Wrapper.wrap(WETH, value);
            WETH.safeTransfer(recipient, value);
        } else if (payer == address(this)) {
            token.safeTransfer(recipient, value);
        } else {
            token.safeTransferFrom(payer, recipient, value);
        }
    }

    receive() external payable {}
}

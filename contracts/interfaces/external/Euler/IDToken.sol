// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDToken {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function underlyingAsset() external view returns (address);

    function totalSupply() external view returns (uint);

    function totalSupplyExact() external view returns (uint);

    function balanceOf(address account) external view returns (uint);

    function balanceOfExact(address account) external view returns (uint);

    function borrow(uint subAccountId, uint amount) external;

    function repay(uint subAccountId, uint amount) external;

    function flashLoan(uint amount, bytes calldata data) external;

    function approveDebt(
        uint subAccountId,
        address spender,
        uint amount
    ) external returns (bool);

    function debtAllowance(
        address holder,
        address spender
    ) external view returns (uint);

    function transfer(address to, uint amount) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint amount
    ) external returns (bool);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IEToken {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external pure returns (uint8);

    function underlyingAsset() external view returns (address);

    function totalSupply() external view returns (uint);

    function totalSupplyUnderlying() external view returns (uint);

    function balanceOf(address account) external view returns (uint);

    function balanceOfUnderlying(address account) external view returns (uint);

    function reserveBalance() external view returns (uint);

    function reserveBalanceUnderlying() external view returns (uint);

    function convertBalanceToUnderlying(
        uint balance
    ) external view returns (uint);

    function convertUnderlyingToBalance(
        uint underlyingAmount
    ) external view returns (uint);

    function touch() external;

    function deposit(uint subAccountId, uint amount) external;

    function withdraw(uint subAccountId, uint amount) external;

    function mint(uint subAccountId, uint amount) external;

    function burn(uint subAccountId, uint amount) external;

    function approve(address spender, uint amount) external returns (bool);

    function approveSubAccount(
        uint subAccountId,
        address spender,
        uint amount
    ) external returns (bool);

    function allowance(
        address holder,
        address spender
    ) external view returns (uint);

    function transfer(address to, uint amount) external returns (bool);

    function transferFromMax(address from, address to) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint amount
    ) external returns (bool);

    function donateToReserves(uint subAccountId, uint amount) external;
}

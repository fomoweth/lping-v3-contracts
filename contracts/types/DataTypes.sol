// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

enum Action {
    Add,
    Remove,
    Replace
}

enum Assumption {
    Bullish,
    Bearish,
    Neutral
}

enum Duration {
    Day,
    Week,
    Month,
    Year
}

struct Module {
    address module;
    bytes4[] signatures;
}

struct Position {
    Assumption assumption;
    Duration duration;
    address token0;
    address token1;
    uint24 fee;
    int24 tickLower;
    int24 tickUpper;
    int24 tickInitial;
    uint32 createdAt;
}

struct Slot {
    mapping(bytes4 => address) modules;
    mapping(address => bytes4[]) signatures;
    mapping(uint256 => Position) positions;
    address owner;
}

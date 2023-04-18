// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../types/DataTypes.sol";

interface IClient {
    event PositionAdded(uint256 indexed tokenId);

    event PositionRemoved(uint256 indexed tokenId);

    function initialize(address owner) external returns (bool);

    function pullTokens(address token, uint256 amount) external payable;

    function sweepToken(
        address token,
        uint256 amount,
        address recipient
    ) external payable;

    function withdrawNFT(uint256 tokenId) external payable;

    function addPosition(uint256 tokenId, Position memory position) external;

    function removePosition(uint256 tokenId) external;

    function getPosition(
        uint256 tokenId
    ) external view returns (Position memory position);

    function getPositionsLength() external view returns (uint256);

    function getTokenIds() external view returns (uint256[] memory tokenIds);

    function getOwner() external view returns (address owner);
}

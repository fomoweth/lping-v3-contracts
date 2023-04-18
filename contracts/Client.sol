// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/external/Uniswap/V3/INonfungiblePositionManager.sol";
import "./interfaces/external/Uniswap/V3/IUniswapV3Pool.sol";
import "./interfaces/external/IERC721Receiver.sol";
import "./interfaces/IClient.sol";
import "./interfaces/IModuleManager.sol";
import "./libraries/Storage.sol";
import "./libraries/TransferHelper.sol";
import "./libraries/Wrapper.sol";
import "./base/Initializable.sol";
import "./base/Multicall.sol";

contract Client is IClient, Initializable, Multicall {
    using TransferHelper for address;

    error InsufficientBalance();
    error InvalidModule();
    error InvalidNFT();
    error InvalidTokenId();
    error MissingData();
    error Restricted();

    address private immutable moduleManager;
    INonfungiblePositionManager private immutable UNISWAP_V3_NFT;
    address private immutable WETH;

    constructor(
        address _moduleManager,
        INonfungiblePositionManager _nft,
        address _weth
    ) {
        moduleManager = _moduleManager;
        UNISWAP_V3_NFT = _nft;
        WETH = _weth;
    }

    modifier restricted() {
        if (slot().owner != msg.sender && address(this) != msg.sender)
            revert Restricted();
        _;
    }

    modifier isOwnerOf(uint256 tokenId) {
        if (UNISWAP_V3_NFT.ownerOf(tokenId) != address(this))
            revert InvalidTokenId();
        _;
    }

    function onERC721Received(
        address,
        address,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4 selector) {
        if (msg.sender != address(UNISWAP_V3_NFT)) revert InvalidNFT();

        if (data.length != 0) {
            (
                Assumption assumption,
                Duration duration,
                int24 tickInitial,
                bool usedEth
            ) = abi.decode(data, (Assumption, Duration, int24, bool));

            (
                ,
                ,
                address token0,
                address token1,
                uint24 fee,
                int24 tickLower,
                int24 tickUpper,
                ,
                ,
                ,
                ,

            ) = UNISWAP_V3_NFT.positions(tokenId);

            addPosition(
                tokenId,
                Position({
                    assumption: assumption,
                    duration: duration,
                    token0: token0,
                    token1: token1,
                    fee: fee,
                    tickLower: tickLower,
                    tickUpper: tickUpper,
                    tickInitial: tickInitial,
                    createdAt: uint32(block.timestamp),
                    usedEth: usedEth
                })
            );
        }

        return this.onERC721Received.selector;
    }

    function initialize(
        address owner
    ) external initializer returns (bool success) {
        Slot storage s = slot();
        s.owner = owner;

        s.modules[IModuleManager.update.selector] = moduleManager;
        s.signatures[moduleManager].push(IModuleManager.update.selector);

        s.modules[IModuleManager.clear.selector] = moduleManager;
        s.signatures[moduleManager].push(IModuleManager.clear.selector);

        return slot().owner == owner;
    }

    function withdrawNFT(uint256 tokenId) external payable {
        Storage.checkOwner(msg.sender);

        removePosition(tokenId);

        UNISWAP_V3_NFT.safeTransferFrom(address(this), msg.sender, tokenId);
    }

    function pullTokens(address token, uint256 amount) external payable {
        Storage.checkOwner(msg.sender);

        token.safeTransferFrom(msg.sender, address(this), amount);

        if (token.isNative()) {
            Wrapper.wrap(WETH, amount);
        }
    }

    function sweepToken(
        address token,
        uint256 amount,
        address recipient
    ) external payable {
        Storage.checkOwner(msg.sender);

        uint256 balance = token.getBalance(address(this));

        if (balance < amount) {
            amount = balance;
        }

        token.safeTransfer(recipient, amount);
    }

    function addPosition(
        uint256 tokenId,
        Position memory position
    ) public restricted isOwnerOf(tokenId) {
        slot().positions[tokenId] = position;

        emit PositionAdded(tokenId);
    }

    function removePosition(
        uint256 tokenId
    ) public restricted isOwnerOf(tokenId) {
        delete slot().positions[tokenId];

        emit PositionRemoved(tokenId);
    }

    function getPosition(
        uint256 tokenId
    ) external view returns (Position memory position) {
        return slot().positions[tokenId];
    }

    function getPositionsLength() external view returns (uint256) {
        return UNISWAP_V3_NFT.balanceOf(address(this));
    }

    function getTokenIds() external view returns (uint256[] memory tokenIds) {
        uint256 length = UNISWAP_V3_NFT.balanceOf(address(this));
        tokenIds = new uint256[](length);

        for (uint256 i; i < length; ) {
            tokenIds[i] = UNISWAP_V3_NFT.tokenOfOwnerByIndex(address(this), i);

            unchecked {
                i = i + 1;
            }
        }
    }

    function getOwner() external view returns (address owner) {
        return slot().owner;
    }

    function slot() private pure returns (Slot storage) {
        return Storage.get();
    }

    function _fallback(address module) private {
        if (module == address(0)) revert InvalidModule();

        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), module, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    receive() external payable {
        // Wrapper.wrap(WETH, msg.value);
    }

    fallback() external payable {
        _fallback(slot().modules[msg.sig]);
    }
}

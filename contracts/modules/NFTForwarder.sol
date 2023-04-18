// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/external/Uniswap/V3/INonfungiblePositionManager.sol";
import "../interfaces/external/Uniswap/V3/IUniswapV3Pool.sol";
import "../interfaces/IClient.sol";
import "../interfaces/INFTForwarder.sol";
import "../libraries/LiquidityAmounts.sol";
import "../libraries/PoolAddress.sol";
import "../libraries/Storage.sol";
import "../libraries/TickMath.sol";
import "../libraries/TransferHelper.sol";
import "../base/Forwarder.sol";

contract NFTForwarder is INFTForwarder, Forwarder {
    using TransferHelper for address;

    address private immutable UNISWAP_V3_FACTORY;
    address private immutable UNISWAP_V3_NFT;

    bytes32 private constant POOL_INIT_CODE_HASH =
        0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54;

    constructor(address _v3Factory, address _nft) {
        UNISWAP_V3_FACTORY = _v3Factory;
        UNISWAP_V3_NFT = _nft;
    }

    function mint(
        MintParams memory params
    )
        external
        payable
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        Storage.checkOwner(msg.sender);

        params.token0.tryApprove(UNISWAP_V3_NFT, params.amount0Desired);
        params.token1.tryApprove(UNISWAP_V3_NFT, params.amount1Desired);

        bytes memory returnData = forward(
            Operation.CALL,
            UNISWAP_V3_NFT,
            abi.encodeWithSelector(
                INonfungiblePositionManager.mint.selector,
                INonfungiblePositionManager.MintParams({
                    token0: params.token0,
                    token1: params.token1,
                    fee: params.fee,
                    tickLower: params.tickLower,
                    tickUpper: params.tickUpper,
                    amount0Desired: params.amount0Desired,
                    amount1Desired: params.amount1Desired,
                    amount0Min: params.amount0Min,
                    amount1Min: params.amount1Min,
                    recipient: address(this),
                    deadline: uint256(params.deadline)
                })
            ),
            0
        );

        (, int24 tickCurrent, , , , , ) = getPool(
            params.token0,
            params.token1,
            params.fee
        ).slot0();

        (tokenId, liquidity, amount0, amount1) = abi.decode(
            returnData,
            (uint256, uint128, uint256, uint256)
        );

        if (params.amount0Desired > amount0)
            params.token0.safeApprove(UNISWAP_V3_NFT, 0);
        if (params.amount1Desired > amount1)
            params.token1.safeApprove(UNISWAP_V3_NFT, 0);

        IClient(address(this)).addPosition(
            tokenId,
            Position({
                assumption: params.assumption,
                duration: params.duration,
                token0: params.token0,
                token1: params.token1,
                fee: params.fee,
                tickLower: params.tickLower,
                tickUpper: params.tickUpper,
                tickInitial: tickCurrent,
                createdAt: params.deadline,
                usedEth: params.useEth
            })
        );
    }

    function addLiquidity(
        ModifyPositionParams memory params
    )
        external
        payable
        returns (uint128 liquidity, uint256 amount0, uint256 amount1)
    {
        Storage.checkOwner(msg.sender);

        (, , address token0, address token1, , , , , , , , ) = positions(
            params.tokenId
        );

        token0.tryApprove(UNISWAP_V3_NFT, params.amount0Desired);
        token1.tryApprove(UNISWAP_V3_NFT, params.amount1Desired);

        bytes memory returnData = forward(
            Operation.CALL,
            UNISWAP_V3_NFT,
            abi.encodeWithSelector(
                INonfungiblePositionManager.increaseLiquidity.selector,
                INonfungiblePositionManager.IncreaseLiquidityParams({
                    tokenId: params.tokenId,
                    amount0Desired: params.amount0Desired,
                    amount1Desired: params.amount1Desired,
                    amount0Min: params.amount0Min,
                    amount1Min: params.amount1Min,
                    deadline: uint256(params.deadline)
                })
            ),
            0
        );

        (liquidity, amount0, amount1) = abi.decode(
            returnData,
            (uint128, uint256, uint256)
        );

        if (params.amount0Desired > amount0)
            token0.safeApprove(UNISWAP_V3_NFT, 0);
        if (params.amount1Desired > amount1)
            token1.safeApprove(UNISWAP_V3_NFT, 0);
    }

    function removeLiquidity(
        ModifyPositionParams memory params
    )
        external
        payable
        returns (uint128 liquidity, uint256 amount0, uint256 amount1)
    {
        Storage.checkOwner(msg.sender);

        uint128 liquidityToBurn = getLiquidityAmountToBurn(
            params.tokenId,
            params.amount0Desired,
            params.amount1Desired
        );

        forward(
            Operation.CALL,
            UNISWAP_V3_NFT,
            abi.encodeWithSelector(
                INonfungiblePositionManager.decreaseLiquidity.selector,
                INonfungiblePositionManager.DecreaseLiquidityParams({
                    tokenId: params.tokenId,
                    liquidity: liquidityToBurn,
                    amount0Min: params.amount0Min,
                    amount1Min: params.amount1Min,
                    deadline: uint256(params.deadline)
                })
            ),
            0
        );

        (amount0, amount1) = collect(params.tokenId);

        (, , , , , , , liquidity, , , , ) = positions(params.tokenId);
    }

    function collect(
        uint256 tokenId
    ) public payable returns (uint256 amount0, uint256 amount1) {
        Storage.checkOwner(msg.sender);

        bytes memory returnData = forward(
            Operation.CALL,
            UNISWAP_V3_NFT,
            abi.encodeWithSelector(
                INonfungiblePositionManager.collect.selector,
                INonfungiblePositionManager.CollectParams({
                    tokenId: tokenId,
                    recipient: address(this),
                    amount0Max: type(uint128).max,
                    amount1Max: type(uint128).max
                })
            ),
            0
        );

        (amount0, amount1) = abi.decode(returnData, (uint256, uint256));
    }

    function burn(
        uint256 tokenId
    ) external payable returns (uint256 amount0, uint256 amount1) {
        Storage.checkOwner(msg.sender);

        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            uint128 liquidity,
            ,
            ,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        ) = positions(tokenId);

        if (liquidity != 0) {
            forward(
                Operation.CALL,
                UNISWAP_V3_NFT,
                abi.encodeWithSelector(
                    INonfungiblePositionManager.decreaseLiquidity.selector,
                    INonfungiblePositionManager.DecreaseLiquidityParams({
                        tokenId: tokenId,
                        liquidity: liquidity,
                        amount0Min: 0,
                        amount1Min: 0,
                        deadline: block.timestamp + 60
                    })
                ),
                0
            );
        }

        if (liquidity != 0 || tokensOwed0 != 0 || tokensOwed1 != 0) {
            (amount0, amount1) = collect(tokenId);
        }

        forward(
            Operation.CALL,
            UNISWAP_V3_NFT,
            abi.encodeWithSelector(
                INonfungiblePositionManager.burn.selector,
                tokenId
            ),
            0
        );
    }

    function getLiquidityAmountToBurn(
        uint256 tokenId,
        uint256 amount0Desired,
        uint256 amount1Desired
    ) private view returns (uint128 liquidityToBurn) {
        (
            ,
            ,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            ,
            ,
            ,

        ) = positions(tokenId);

        (uint160 sqrtRatioX96, , , , , , ) = getPool(token0, token1, fee)
            .slot0();

        liquidityToBurn = LiquidityAmounts.getLiquidityForAmounts(
            sqrtRatioX96,
            TickMath.getSqrtRatioAtTick(tickLower),
            TickMath.getSqrtRatioAtTick(tickUpper),
            amount0Desired,
            amount1Desired
        );

        if (liquidityToBurn > liquidity) {
            liquidityToBurn = liquidity;
        }
    }

    function positions(
        uint256 tokenId
    )
        private
        view
        returns (
            uint96 nonce,
            address operator,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        )
    {
        return INonfungiblePositionManager(UNISWAP_V3_NFT).positions(tokenId);
    }

    function getPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) private view returns (IUniswapV3Pool) {
        return
            IUniswapV3Pool(
                PoolAddress.computeAddress(
                    UNISWAP_V3_FACTORY,
                    tokenA,
                    tokenB,
                    fee
                )
            );
    }
}

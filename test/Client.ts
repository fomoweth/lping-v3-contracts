import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { TickMath } from "@uniswap/v3-sdk";
import { expect } from "chai";
import { BigNumber, constants } from "ethers";
import { ethers } from "hardhat";

import { UNISWAP_V3_CONTRACTS } from "./shared/constants/addresses";
import { Assumption, Duration, PoolFee } from "./shared/constants/enums";
import { completeFixture } from "./shared/env/fixtures";
import { initTestEnv } from "./shared/env/testEnv";
import { getCollateralAndBorrowAmounts } from "./shared/helpers/euler";
import {
	encodeMint,
	encodePullTokens,
	encodeSweepTokens,
	encodeSwap,
	encodeSupplyAndBorrow
} from "./shared/helpers/encoder";
import { getPoolContract, getPoolState } from "./shared/helpers/pools";
import { exactInSingle } from "./shared/helpers/quoter";
import { approve, getBalance } from "./shared/helpers/tokens";
import { getPools } from "./shared/schema";
import { PoolModel } from "./shared/types";
import { isSameAddress, isWrappedNative } from "./shared/utils/addresses";
import { getBalanceSlot, seedTokens, wrapETH } from "./shared/utils/funds";
import { getAmountsForLiquidity } from "./shared/utils/liquidity";
import { Logger } from "./shared/utils/logger";
import { computePositionRange, getLiquidityAmounts } from "./shared/utils/positions";
import { setDeadline } from "./shared/utils/time";
import { parseUnits } from "./shared/utils/units";

import { Client, INonfungiblePositionManager__factory } from "../typechain-types";


const DURATIONS: Duration[] = [
	Duration.DAY,
	Duration.WEEK,
	Duration.MONTH,
	Duration.YEAR
]

const POOL_NAMES: string[] = [
	// "USDC-WETH/3000",
	// "WETH-USDT/3000",
	"WBTC-WETH/3000",
	"UNI-WETH/3000",
	"LINK-WETH/3000",
	"WETH-ENS/3000",
	"WETH-GRT/3000"
]

const POOLS = getPools(POOL_NAMES)

const logger = new Logger()

initTestEnv({ title: "Client", tracer: { enabled: true } })
	.set({
		desc: "should successfully open a new position with owned tokens",
		action: async (env) => {
			const assumption = Assumption.BULLISH
			const ethAmount = parseUnits(5)

			for (const pool of POOLS) {
				for (const duration of DURATIONS) {
					const [token0, token1] = pool.tokens

					const [weth, token, zeroForOne] = !!isWrappedNative(token0.address)
						? [token0, token1, false]
						: [token1, token0, true]

					const {
						traders,
						clients
					} = await loadFixture(completeFixture)

					const client = clients[0]
					const ownerAddress = await client.getOwner()
					const trader = traders.find((trader) => !!isSameAddress(trader.address, ownerAddress))!

					const slot = await getBalanceSlot(token.address)

					await seedTokens(token, slot, ethAmount, [trader.address])

					const tokenAmount = await getBalance(token.address, trader.address)

					const tokenAmountDesired = tokenAmount
					const ethAmountDesired = BigNumber.from(0)

					const [amount0Desired, amount1Desired] = !!zeroForOne
						? [tokenAmountDesired, ethAmountDesired]
						: [ethAmountDesired, tokenAmountDesired]

					const poolContract = getPoolContract(pool.address)
					const { sqrtPriceX96: sqrtRatioX96 } = await getPoolState(poolContract)

					const { lower: tickLower, upper: tickUpper } = computePositionRange(
						assumption,
						duration,
						token,
						weth,
						pool.fee,
						sqrtRatioX96
					)

					const { liquidity, amount0, amount1 } = getLiquidityAmounts(
						sqrtRatioX96,
						tickLower,
						tickUpper,
						amount0Desired,
						amount1Desired
					)

					const leftover0 = amount0Desired.sub(amount0)
					const leftover1 = amount1Desired.sub(amount1)

					if (!!zeroForOne) {
						expect(amount0).to.be.gt(0)
						expect(amount1).to.be.eq(0)
					} else {
						expect(amount0).to.be.eq(0)
						expect(amount1).to.be.gt(0)
					}

					await approve(token.address, client.address, trader)

					const deadline = await setDeadline()

					const payloads: string[] = [
						encodePullTokens(
							token.address,
							tokenAmountDesired
						),
						encodeMint(
							assumption,
							duration,
							token0.address,
							token1.address,
							pool.fee,
							tickLower,
							tickUpper,
							amount0Desired,
							amount1Desired,
							0,
							0,
							deadline,
							false
						),
						encodeSweepTokens(
							token.address,
							constants.MaxUint256,
							trader.address,
						),
					]

					const tx = await client.connect(trader).multicall(payloads)
					await tx.wait()

					const result = await getReport(client, pool, amount0Desired, amount1Desired, !env.tracer.enabled)

					expect(result.token0).to.be.eq(token0.address)
					expect(result.token1).to.be.eq(token1.address)
					expect(result.fee).to.be.eq(PoolFee[pool.fee])
					expect(result.tickLower).to.be.eq(tickLower)
					expect(result.tickUpper).to.be.eq(tickUpper)
					expect(result.liquidity).to.be.eq(liquidity)
					expect(result.amount0).to.be.closeTo(amount0, 10)
					expect(result.amount1).to.be.closeTo(amount1, 10)
					expect(result.refunded0).to.be.closeTo(leftover0, 10)
					expect(result.refunded1).to.be.closeTo(leftover1, 10)
				}
			}
		}
	})
	.set({
		desc: "should successfully swap ETH for tokens, then open a new position",
		action: async (env) => {
			const assumption = Assumption.BULLISH
			const ethAmount = parseUnits(5)

			for (const pool of POOLS) {
				for (const duration of DURATIONS) {
					const {
						traders,
						clients,
						adapters: { v3Swap }
					} = await loadFixture(completeFixture)

					const client = clients[0]
					const ownerAddress = await client.getOwner()
					const trader = traders.find((trader) => !!isSameAddress(trader.address, ownerAddress))!

					const [token0, token1] = pool.tokens

					const [weth, token, zeroForOne] = !!isWrappedNative(token0.address)
						? [token0, token1, true]
						: [token1, token0, false]

					const tokenIn = weth
					const tokenOut = token
					const amountIn = ethAmount

					await wrapETH(trader, amountIn)

					const {
						amount: quotedAmountOut,
						sqrtPriceX96After: sqrtRatioX96,
					} = await exactInSingle(tokenIn, tokenOut, pool.fee, amountIn)

					const amountOut = BigNumber.from(quotedAmountOut)

					const ethAmountDesired = BigNumber.from(0)
					const tokenAmountDesired = amountOut

					const [amount0Desired, amount1Desired] = !!zeroForOne
						? [ethAmountDesired, tokenAmountDesired]
						: [tokenAmountDesired, ethAmountDesired]

					const { lower: tickLower, upper: tickUpper } = computePositionRange(
						assumption,
						duration,
						token,
						weth,
						pool.fee,
						sqrtRatioX96
					)

					const { liquidity, amount0, amount1 } = getLiquidityAmounts(
						sqrtRatioX96,
						tickLower,
						tickUpper,
						amount0Desired,
						amount1Desired
					)

					if (!zeroForOne) {
						expect(amount0).to.be.gt(0)
						expect(amount1).to.be.eq(0)
					} else {
						expect(amount0).to.be.eq(0)
						expect(amount1).to.be.gt(0)
					}

					await approve(weth.address, client.address, trader)

					const deadline = await setDeadline()

					const payloads: string[] = [
						encodePullTokens(
							tokenIn.address,
							amountIn
						),
						encodeSwap(
							[
								{
									adapterId: await v3Swap.id(),
									pool: pool.address,
									tokenIn: tokenIn.address,
									tokenOut: tokenOut.address
								}
							],
							amountIn,
							amountOut,
							deadline
						),
						encodeMint(
							assumption,
							duration,
							token0.address,
							token1.address,
							pool.fee,
							tickLower,
							tickUpper,
							amount0Desired,
							amount1Desired,
							0,
							0,
							deadline,
							true
						),
						encodeSweepTokens(
							token.address,
							constants.MaxUint256,
							trader.address,
						),
					]

					const tx = await client.connect(trader).multicall(payloads)
					await tx.wait()

					const result = await getReport(client, pool, amount0Desired, amount1Desired, !env.tracer.enabled)

					expect(result.token0).to.be.eq(token0.address)
					expect(result.token1).to.be.eq(token1.address)
					expect(result.fee).to.be.eq(PoolFee[pool.fee])
					expect(result.tickLower).to.be.eq(tickLower)
					expect(result.tickUpper).to.be.eq(tickUpper)
					expect(result.liquidity).to.be.eq(liquidity)
					expect(result.amount0).to.be.closeTo(amount0, 10)
					expect(result.amount1).to.be.closeTo(amount1, 10)
				}
			}
		}
	})
	.set({
		desc: "should successfully swap tokens for ETH, then open a new position",
		action: async (env) => {
			const assumption = Assumption.BEARISH
			const ethAmount = parseUnits(5)

			for (const pool of POOLS) {
				for (const duration of DURATIONS) {
					const {
						traders,
						clients,
						adapters: { v3Swap }
					} = await loadFixture(completeFixture)

					const client = clients[0]
					const ownerAddress = await client.getOwner()
					const trader = traders.find((trader) => !!isSameAddress(trader.address, ownerAddress))!

					const [token0, token1] = pool.tokens

					const [weth, token, zeroForOne] = !!isWrappedNative(token0.address)
						? [token0, token1, false]
						: [token1, token0, true]

					const tokenIn = token
					const tokenOut = weth

					const slot = await getBalanceSlot(token.address)

					await seedTokens(token, slot, ethAmount, [trader.address])

					const amountIn = await getBalance(token.address, trader.address)

					const {
						amount: quotedAmountOut,
						sqrtPriceX96After: sqrtRatioX96,
					} = await exactInSingle(token, weth, pool.fee, amountIn)

					const amountOut = BigNumber.from(quotedAmountOut)

					const ethAmountDesired = amountOut
					const tokenAmountDesired = BigNumber.from(0)

					const [amount0Desired, amount1Desired] = !!zeroForOne
						? [tokenAmountDesired, ethAmountDesired]
						: [ethAmountDesired, tokenAmountDesired]

					const { lower: tickLower, upper: tickUpper } = computePositionRange(
						assumption,
						duration,
						token,
						weth,
						pool.fee,
						sqrtRatioX96
					)

					const { liquidity, amount0, amount1 } = getLiquidityAmounts(
						sqrtRatioX96,
						tickLower,
						tickUpper,
						amount0Desired,
						amount1Desired
					)

					if (!zeroForOne) {
						expect(amount0).to.be.gt(0)
						expect(amount1).to.be.eq(0)
					} else {
						expect(amount0).to.be.eq(0)
						expect(amount1).to.be.gt(0)
					}

					await approve(token.address, client.address, trader)

					const deadline = await setDeadline()

					const payloads: string[] = [
						encodePullTokens(
							token.address,
							amountIn
						),
						encodeSwap(
							[
								{
									adapterId: await v3Swap.id(),
									pool: pool.address,
									tokenIn: tokenIn.address,
									tokenOut: tokenOut.address
								}
							],
							amountIn,
							amountOut,
							deadline
						),
						encodeMint(
							assumption,
							duration,
							token0.address,
							token1.address,
							pool.fee,
							tickLower,
							tickUpper,
							amount0Desired,
							amount1Desired,
							0,
							0,
							deadline,
							true
						),
						encodeSweepTokens(
							weth.address,
							constants.MaxUint256,
							trader.address,
						),
					]

					const tx = await client.connect(trader).multicall(payloads)
					await tx.wait()

					const result = await getReport(client, pool, amount0Desired, amount1Desired, !env.tracer.enabled)

					expect(result.token0).to.be.eq(token0.address)
					expect(result.token1).to.be.eq(token1.address)
					expect(result.fee).to.be.eq(PoolFee[pool.fee])
					expect(result.tickLower).to.be.eq(tickLower)
					expect(result.tickUpper).to.be.eq(tickUpper)
					expect(result.liquidity).to.be.eq(liquidity)
					expect(result.amount0).to.be.closeTo(amount0, 10)
					expect(result.amount1).to.be.closeTo(amount1, 10)
				}
			}
		}
	})
	.set({
		desc: "should successfully supply ETH and borrow tokens on Euler Finance, swap borrowed tokens for ETH, then open a new position",
		action: async (env) => {
			const assumption = Assumption.BEARISH
			const ethAmount = parseUnits(5)
			const debtRatio = 9000

			for (const pool of POOLS) {
				for (const duration of DURATIONS) {
					const {
						traders,
						clients,
						adapters: { eulerAdapter, v3Swap }
					} = await loadFixture(completeFixture)

					const client = clients[0]
					const ownerAddress = await client.getOwner()
					const trader = traders.find((trader) => !!isSameAddress(trader.address, ownerAddress))!

					const [token0, token1] = pool.tokens

					const [weth, token, zeroForOne] = !!isWrappedNative(token0.address)
						? [token0, token1, true]
						: [token1, token0, false]

					const collateralToken = weth
					const borrowToken = token
					const tokenIn = token
					const tokenOut = weth

					const { collateralAmount, borrowAmount } = await getCollateralAndBorrowAmounts(
						assumption,
						collateralToken,
						borrowToken,
						ethAmount,
						debtRatio
					)

					const amountIn = borrowAmount

					const {
						amount: quotedAmountOut,
						sqrtPriceX96After: sqrtRatioX96,
					} = await exactInSingle(tokenIn, tokenOut, pool.fee, amountIn)

					const amountOut = BigNumber.from(quotedAmountOut)

					const ethAmountDesired = amountOut
					const tokenAmountDesired = BigNumber.from(0)

					const [amount0Desired, amount1Desired] = !!zeroForOne
						? [ethAmountDesired, tokenAmountDesired]
						: [tokenAmountDesired, ethAmountDesired]

					const { lower: tickLower, upper: tickUpper } = computePositionRange(
						assumption,
						duration,
						token,
						weth,
						pool.fee,
						sqrtRatioX96
					)

					const { liquidity, amount0, amount1 } = getLiquidityAmounts(
						sqrtRatioX96,
						tickLower,
						tickUpper,
						amount0Desired,
						amount1Desired
					)

					if (!!zeroForOne) {
						expect(amount0).to.be.gt(0)
						expect(amount1).to.be.eq(0)
					} else {
						expect(amount0).to.be.eq(0)
						expect(amount1).to.be.gt(0)
					}

					await wrapETH(trader, ethAmount)

					await approve(weth.address, client.address, trader)

					const deadline = await setDeadline()

					const payloads: string[] = [
						encodePullTokens(
							collateralToken.address,
							ethAmount
						),
						encodeSupplyAndBorrow(
							await eulerAdapter.id(),
							collateralToken.address,
							borrowToken.address,
							collateralAmount,
							borrowAmount
						),
						encodeSwap(
							[
								{
									adapterId: await v3Swap.id(),
									pool: pool.address,
									tokenIn: tokenIn.address,
									tokenOut: tokenOut.address
								}
							],
							amountIn,
							amountOut,
							deadline
						),
						encodeMint(
							assumption,
							duration,
							token0.address,
							token1.address,
							pool.fee,
							tickLower,
							tickUpper,
							amount0Desired,
							amount1Desired,
							0,
							0,
							deadline,
							true
						),
						encodeSweepTokens(
							weth.address,
							constants.MaxUint256,
							trader.address,
						),
					]

					const tx = await client.connect(trader).multicall(payloads)
					await tx.wait()

					const result = await getReport(client, pool, amount0Desired, amount1Desired, !env.tracer.enabled)

					expect(result.token0).to.be.eq(token0.address)
					expect(result.token1).to.be.eq(token1.address)
					expect(result.fee).to.be.eq(PoolFee[pool.fee])
					expect(result.tickLower).to.be.eq(tickLower)
					expect(result.tickUpper).to.be.eq(tickUpper)
					expect(result.liquidity).to.be.eq(liquidity)
					expect(result.amount0).to.be.closeTo(amount0, 10)
					expect(result.amount1).to.be.closeTo(amount1, 10)
				}
			}
		}
	})
	.set({
		desc: "should successfully swap tokens for ETH then open a new position",
		action: async (env) => {
			const assumption = Assumption.NEUTRAL
			const ethAmount = parseUnits(5)

			for (const pool of POOLS) {
				for (const duration of DURATIONS) {
					const {
						traders,
						clients,
						adapters: { v3Swap }
					} = await loadFixture(completeFixture)

					const client = clients[0]
					const ownerAddress = await client.getOwner()
					const trader = traders.find((trader) => !!isSameAddress(trader.address, ownerAddress))!

					const [token0, token1] = pool.tokens

					const [weth, token, zeroForOne] = !!isWrappedNative(token0.address)
						? [token0, token1, false]
						: [token1, token0, true]

					const tokenIn = token
					const tokenOut = weth

					const slot = await getBalanceSlot(token.address)

					await seedTokens(token, slot, ethAmount, [trader.address])

					const tokenAmount = await getBalance(token.address, trader.address)

					const amountIn = tokenAmount.div(2)

					const {
						amount: quotedAmountOut,
						sqrtPriceX96After: sqrtRatioX96,
					} = await exactInSingle(token, weth, pool.fee, amountIn)

					const amountOut = BigNumber.from(quotedAmountOut)

					const [amount0Desired, amount1Desired] = !!zeroForOne
						? [amountIn, amountOut]
						: [amountOut, amountIn]

					const { lower: tickLower, upper: tickUpper } = computePositionRange(
						assumption,
						duration,
						token,
						weth,
						pool.fee,
						sqrtRatioX96
					)

					const { liquidity, amount0, amount1 } = getLiquidityAmounts(
						sqrtRatioX96,
						tickLower,
						tickUpper,
						amount0Desired,
						amount1Desired
					)

					expect(amount0 && amount1).to.be.gt(0)

					await approve(token.address, client.address, trader)

					const deadline = await setDeadline()

					const payloads: string[] = [
						encodePullTokens(
							token.address,
							tokenAmount
						),
						encodeSwap(
							[
								{
									adapterId: await v3Swap.id(),
									pool: pool.address,
									tokenIn: tokenIn.address,
									tokenOut: tokenOut.address
								}
							],
							amountIn,
							amountOut,
							deadline
						),
						encodeMint(
							assumption,
							duration,
							token0.address,
							token1.address,
							pool.fee,
							tickLower,
							tickUpper,
							amount0Desired,
							amount1Desired,
							0,
							0,
							deadline,
							true
						),
						encodeSweepTokens(
							token0.address,
							constants.MaxUint256,
							trader.address,
						),
						encodeSweepTokens(
							token1.address,
							constants.MaxUint256,
							trader.address,
						),
					]

					const tx = await client.connect(trader).multicall(payloads)
					await tx.wait()

					const result = await getReport(client, pool, amount0Desired, amount1Desired, !env.tracer.enabled)

					expect(result.token0).to.be.eq(token0.address)
					expect(result.token1).to.be.eq(token1.address)
					expect(result.fee).to.be.eq(PoolFee[pool.fee])
					expect(result.tickLower).to.be.eq(tickLower)
					expect(result.tickUpper).to.be.eq(tickUpper)
					expect(result.liquidity).to.be.eq(liquidity)
					expect(result.amount0).to.be.closeTo(amount0, 10)
					expect(result.amount1).to.be.closeTo(amount1, 10)
				}
			}
		}
	})
	.set({
		desc: "should successfully supply ETH and borrow tokens on Euler Finance then open a new position",
		action: async (env) => {
			const assumption = Assumption.NEUTRAL
			const ethAmount = parseUnits(5)
			const debtRatio = 9000

			for (const pool of POOLS) {
				for (const duration of DURATIONS) {
					const {
						traders,
						clients,
						adapters: { eulerAdapter }
					} = await loadFixture(completeFixture)

					const client = clients[0]
					const ownerAddress = await client.getOwner()
					const trader = traders.find((trader) => !!isSameAddress(trader.address, ownerAddress))!

					const [token0, token1] = pool.tokens

					const [weth, token, zeroForOne] = !!isWrappedNative(token0.address)
						? [token0, token1, true]
						: [token1, token0, false]

					const collateralToken = weth
					const borrowToken = token

					const { collateralAmount, borrowAmount } = await getCollateralAndBorrowAmounts(
						assumption,
						weth,
						token,
						ethAmount,
						debtRatio
					)

					const ethAmountDesired = ethAmount.sub(collateralAmount)
					const tokenAmountDesired = borrowAmount

					const [amount0Desired, amount1Desired] = !!zeroForOne
						? [ethAmountDesired, tokenAmountDesired]
						: [tokenAmountDesired, ethAmountDesired]

					const poolContract = getPoolContract(pool.address)
					const { sqrtPriceX96: sqrtRatioX96 } = await getPoolState(poolContract)

					const { lower: tickLower, upper: tickUpper } = computePositionRange(
						assumption,
						duration,
						weth,
						token,
						pool.fee,
						sqrtRatioX96
					)

					const { liquidity, amount0, amount1 } = getLiquidityAmounts(
						sqrtRatioX96,
						tickLower,
						tickUpper,
						amount0Desired,
						amount1Desired
					)

					expect(amount0 && amount1).to.be.gt(0)

					await wrapETH(trader, ethAmount)

					await approve(weth.address, client.address, trader)

					const deadline = await setDeadline()

					const payloads: string[] = [
						encodePullTokens(
							weth.address,
							ethAmount
						),
						encodeSupplyAndBorrow(
							await eulerAdapter.id(),
							collateralToken.address,
							borrowToken.address,
							collateralAmount,
							borrowAmount
						),
						encodeMint(
							assumption,
							duration,
							token0.address,
							token1.address,
							pool.fee,
							tickLower,
							tickUpper,
							amount0Desired,
							amount1Desired,
							0,
							0,
							deadline,
							true
						),
						encodeSweepTokens(
							token0.address,
							constants.MaxUint256,
							trader.address,
						),
						encodeSweepTokens(
							token1.address,
							constants.MaxUint256,
							trader.address,
						),
					]

					const tx = await client.connect(trader).multicall(payloads)
					await tx.wait()

					const result = await getReport(client, pool, amount0Desired, amount1Desired, !env.tracer.enabled)

					expect(result.token0).to.be.eq(token0.address)
					expect(result.token1).to.be.eq(token1.address)
					expect(result.fee).to.be.eq(PoolFee[pool.fee])
					expect(result.tickLower).to.be.eq(tickLower)
					expect(result.tickUpper).to.be.eq(tickUpper)
					expect(result.liquidity).to.be.eq(liquidity)
					expect(result.amount0).to.be.closeTo(amount0, 10)
					expect(result.amount1).to.be.closeTo(amount1, 10)
				}
			}
		}
	})
	.run()


const getReport = async (
	client: Client,
	pool: PoolModel,
	amount0Desired: BigNumber,
	amount1Desired: BigNumber,
	logResult: boolean
) => {
	const nft = INonfungiblePositionManager__factory.connect(UNISWAP_V3_CONTRACTS.NFT, ethers.provider)

	const tokenId = await nft.tokenOfOwnerByIndex(client.address, 0)

	const { liquidity } = await nft.positions(tokenId)

	const owner = await client.getOwner()

	const {
		assumption,
		duration,
		token0,
		token1,
		fee,
		tickLower,
		tickUpper,
		createdAt,
		usedEth
	} = await client.getPosition(tokenId)

	const poolContract = getPoolContract(pool.address)
	const { sqrtPriceX96 } = await poolContract.slot0()

	const sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(tickLower)
	const sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(tickUpper)

	const { amount0, amount1 } = getAmountsForLiquidity(
		sqrtPriceX96,
		sqrtRatioAX96,
		sqrtRatioBX96,
		liquidity
	)

	const [refunded0, refunded1] = await Promise.all([
		getBalance(token0, owner),
		getBalance(token1, owner),
	])

	const position = {
		assumption: Assumption[assumption],
		duration: Duration[duration],
		token0: token0,
		token1: token1,
		fee: PoolFee[fee],
		tickLower: tickLower,
		tickUpper: tickUpper,
		createdAt: createdAt,
		usedEth: usedEth,
		liquidity: liquidity,
		amount0Desired,
		amount1Desired,
		amount0: BigNumber.from(amount0.toString()),
		amount1: BigNumber.from(amount1.toString()),
		refunded0,
		refunded1,
	}

	if (!!logResult) {
		logger.log("Result", position)
	}

	return position
}

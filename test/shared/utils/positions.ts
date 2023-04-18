import { TickMath } from "@uniswap/v3-sdk";
import { BigNumber } from "ethers";

import { Assumption, Duration, PoolFee, SCALING_FACTOR, TICK_SPACING } from "../constants/enums";
import { TokenModel } from "../types";

import { isSameAddress, isWrappedNative } from "./addresses";
import { BigNumberish, toBI } from "./bn";
import { formatSqrtRatioX96, getTickFromPrice } from "./ticks";
import { getAmountsForLiquidity, getLiquidityForAmounts } from "./liquidity";


export const computePositionRange = (
	assumption: Assumption,
	duration: Duration,
	baseToken: TokenModel,
	quoteToken: TokenModel,
	fee: PoolFee,
	sqrtPriceX96Target: BigNumberish
): { lower: number, upper: number } => {
	if (!!isSameAddress(baseToken.address, quoteToken.address)) {
		throw new Error("IDENTICAL ADDRESSES")
	}

	if (!isWrappedNative(baseToken.address) && !isWrappedNative(quoteToken.address)) {
		throw new Error("!WETH")
	}

	const [token0, token1, sorted] = baseToken.address < quoteToken.address
		? [baseToken, quoteToken, true]
		: [quoteToken, baseToken, false]

	// define the tick spacing of the pool
	const tickSpacing = TICK_SPACING[fee]

	// define the scaling factor
	const r = SCALING_FACTOR[duration]

	// convert the target sqrtRatioX96 into price
	let priceTarget = formatSqrtRatioX96(sqrtPriceX96Target, token0.decimals, token1.decimals)

	if (!sorted) {
		priceTarget = 1 / priceTarget
	}

	// convert the target sqrtRatioX96 into tick
	const tickTarget = TickMath.getTickAtSqrtRatio(toBI(sqrtPriceX96Target))

	// compute min price and max price based on the target price and scaling factor then convert the prices into ticks
	let priceLower: number, priceUpper: number

	switch (assumption) {
		case Assumption.BULLISH:
			priceLower = priceTarget
			priceUpper = priceTarget * (r * r)
			break

		case Assumption.BEARISH:
			priceLower = priceTarget / (r * r)
			priceUpper = priceTarget
			break

		case Assumption.NEUTRAL:
			priceLower = priceTarget / r
			priceUpper = priceTarget * r
			break
	}

	let [tickLower, tickUpper] = [
		getTickFromPrice(priceLower, token0.decimals, token1.decimals, sorted, tickSpacing),
		getTickFromPrice(priceUpper, token0.decimals, token1.decimals, sorted, tickSpacing),
	].sort((a, b) => a - b)

	if (assumption === Assumption.BULLISH) {
		if (!!sorted && tickLower < tickTarget) {
			tickLower += tickSpacing
		}

		if (!sorted && tickUpper > tickTarget) {
			tickUpper -= tickSpacing
		}
	}

	if (assumption === Assumption.BEARISH) {
		if (!!sorted && tickUpper > tickTarget) {
			tickUpper -= tickSpacing
		}

		if (!sorted && tickLower < tickTarget) {
			tickLower += tickSpacing
		}
	}

	return { lower: tickLower, upper: tickUpper }
}

export const getLiquidityAmounts = (
	sqrtRatioX96: BigNumberish,
	tickLower: number,
	tickUpper: number,
	amount0Desired: BigNumberish,
	amount1Desired: BigNumberish
): { liquidity: BigNumber, amount0: BigNumber, amount1: BigNumber } => {

	const sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(tickLower)
	const sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(tickUpper)

	const liquidity = getLiquidityForAmounts(
		sqrtRatioX96,
		sqrtRatioAX96,
		sqrtRatioBX96,
		amount0Desired,
		amount1Desired
	)

	const { amount0, amount1 } = getAmountsForLiquidity(
		sqrtRatioX96,
		sqrtRatioAX96,
		sqrtRatioBX96,
		liquidity
	)

	return {
		liquidity: BigNumber.from(liquidity.toString()),
		amount0: BigNumber.from(amount0.toString()),
		amount1: BigNumber.from(amount1.toString()),
	}
}

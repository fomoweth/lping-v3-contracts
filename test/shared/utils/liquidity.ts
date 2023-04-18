import JSBI from "jsbi";

import { BigNumberish, constants, mulDivRoundingUp, toBI } from "./bn";


const { Q96, ZERO } = constants

const RESOLUTION = JSBI.BigInt(96)

export const getAmount0ForLiquidity = (
	sqrtRatioAX96: BigNumberish,
	sqrtRatioBX96: BigNumberish,
	liquidity: BigNumberish
): JSBI => {
	sqrtRatioAX96 = toBI(sqrtRatioAX96)
	sqrtRatioBX96 = toBI(sqrtRatioBX96)
	liquidity = toBI(liquidity)

	if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
		;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
	}

	return JSBI.divide(
		mulDivRoundingUp(
			JSBI.leftShift(liquidity, RESOLUTION),
			JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96),
			sqrtRatioBX96
		),
		sqrtRatioAX96
	)
}

export const getAmount1ForLiquidity = (
	sqrtRatioAX96: BigNumberish,
	sqrtRatioBX96: BigNumberish,
	liquidity: BigNumberish
): JSBI => {
	sqrtRatioAX96 = toBI(sqrtRatioAX96)
	sqrtRatioBX96 = toBI(sqrtRatioBX96)
	liquidity = toBI(liquidity)

	if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
		;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
	}

	return mulDivRoundingUp(
		liquidity,
		JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96),
		Q96
	)
}

export const getAmountsForLiquidity = (
	sqrtRatioX96: BigNumberish,
	sqrtRatioAX96: BigNumberish,
	sqrtRatioBX96: BigNumberish,
	liquidity: BigNumberish
): { amount0: JSBI, amount1: JSBI } => {
	sqrtRatioX96 = toBI(sqrtRatioX96)
	sqrtRatioAX96 = toBI(sqrtRatioAX96)
	sqrtRatioBX96 = toBI(sqrtRatioBX96)
	liquidity = toBI(liquidity)

	if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
		;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
	}

	let amount0 = ZERO,
		amount1 = ZERO

	if (JSBI.lessThanOrEqual(sqrtRatioX96, sqrtRatioAX96)) {
		amount0 = getAmount0ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity);
	} else if (JSBI.lessThan(sqrtRatioX96, sqrtRatioBX96)) {
		amount0 = getAmount0ForLiquidity(sqrtRatioX96, sqrtRatioBX96, liquidity);
		amount1 = getAmount1ForLiquidity(sqrtRatioAX96, sqrtRatioX96, liquidity);
	} else {
		amount1 = getAmount1ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity);
	}

	return { amount0, amount1 }
}

export const getLiquidityForAmount0Imprecise = (sqrtRatioAX96: BigNumberish, sqrtRatioBX96: BigNumberish, amount0: BigNumberish): JSBI => {
	sqrtRatioAX96 = toBI(sqrtRatioAX96)
	sqrtRatioBX96 = toBI(sqrtRatioBX96)
	amount0 = toBI(amount0)

	if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
		;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
	}

	const intermediate = JSBI.divide(
		JSBI.multiply(sqrtRatioAX96, sqrtRatioBX96),
		Q96
	)

	return JSBI.divide(
		JSBI.multiply(amount0, intermediate),
		JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96)
	)
}

export const getLiquidityForAmount0Precise = (sqrtRatioAX96: BigNumberish, sqrtRatioBX96: BigNumberish, amount0: BigNumberish): JSBI => {
	sqrtRatioAX96 = toBI(sqrtRatioAX96)
	sqrtRatioBX96 = toBI(sqrtRatioBX96)
	amount0 = toBI(amount0)

	if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
		;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
	}

	const numerator = JSBI.multiply(JSBI.multiply(amount0, sqrtRatioAX96), sqrtRatioBX96)
	const denominator = JSBI.multiply(Q96, JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96))

	return JSBI.divide(numerator, denominator)
}

export const getLiquidityForAmount1 = (sqrtRatioAX96: BigNumberish, sqrtRatioBX96: BigNumberish, amount1: BigNumberish): JSBI => {
	sqrtRatioAX96 = toBI(sqrtRatioAX96)
	sqrtRatioBX96 = toBI(sqrtRatioBX96)
	amount1 = toBI(amount1)

	if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
		;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
	}
	return JSBI.divide(JSBI.multiply(JSBI.BigInt(amount1), Q96), JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96))
}

export const getLiquidityForAmounts = (
	sqrtRatioX96: BigNumberish,
	sqrtRatioAX96: BigNumberish,
	sqrtRatioBX96: BigNumberish,
	amount0: BigNumberish,
	amount1: BigNumberish,
	useFullPrecision: boolean = true
): JSBI => {
	sqrtRatioX96 = toBI(sqrtRatioX96)
	sqrtRatioAX96 = toBI(sqrtRatioAX96)
	sqrtRatioBX96 = toBI(sqrtRatioBX96)

	if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
		;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
	}

	const getLiquidityForAmount0 = useFullPrecision ? getLiquidityForAmount0Imprecise : getLiquidityForAmount0Precise

	if (JSBI.lessThanOrEqual(sqrtRatioX96, sqrtRatioAX96)) {
		return getLiquidityForAmount0(sqrtRatioAX96, sqrtRatioBX96, amount0)
	} else if (JSBI.lessThan(sqrtRatioX96, sqrtRatioBX96)) {
		const liquidity0 = getLiquidityForAmount0(sqrtRatioX96, sqrtRatioBX96, amount0)
		const liquidity1 = getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioX96, amount1)
		return JSBI.lessThan(liquidity0, liquidity1) ? liquidity0 : liquidity1
	} else {
		return getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1)
	}
}
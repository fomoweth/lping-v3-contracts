import { FullMath } from "@uniswap/v3-sdk";
import bn from "bignumber.js";
import Decimal from "decimal.js";
import JSBI from "jsbi";

import { TokenModel } from "../types";

import { BigNumberish, sqrt, toBI } from "./bn";
import { formatUnits } from "./units";


bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 })

const Q96 = new bn(2).pow(96)
const BASE_TICK = 1.0001
const MIN_TICK = -887272
const MAX_TICK = -MIN_TICK

const expandDecimals = (value: number, unit?: number) => {
	return new bn(value).multipliedBy(new bn(10).pow(unit ?? 18))
}

export const encodeSqrtRatioX96 = (price: number | string | bn) => {
	return new bn(price).sqrt().multipliedBy(Q96).integerValue(3)
}

export const formatSqrtRatioX96 = (sqrtRatioX96: bn | BigNumberish, decimals0: number, decimals1: number) => {
	Decimal.set({ toExpPos: 9_999_999, toExpNeg: -9_999_999 })

	let ratio = new Decimal(((parseInt(sqrtRatioX96.toString()) / 2 ** 96) ** 2).toString())

	if (decimals1 < decimals0) {
		ratio = ratio.mul(new bn(10).pow(decimals0 - decimals1).toString())
	} else {
		ratio = ratio.div(new bn(10).pow(decimals1 - decimals0).toString())
	}

	return parseFloat(ratio.toString())
}

export const encodeSqrtPriceX96 = (amount1: BigNumberish, amount0: BigNumberish): JSBI => {
	const numerator = JSBI.leftShift(toBI(amount1), toBI(192))
	const denominator = toBI(amount0)
	const ratioX192 = JSBI.divide(numerator, denominator)
	return sqrt(ratioX192)
}

export const formatSqrtPriceX96 = (sqrtRatioX96: BigNumberish, baseToken: TokenModel, quoteToken: TokenModel) => {
	const baseAmount = JSBI.exponentiate(toBI(10), toBI(baseToken.decimals))
	const shift = JSBI.leftShift(toBI(1), toBI(192))
	const ratioX192 = JSBI.multiply(toBI(sqrtRatioX96), toBI(sqrtRatioX96))
	let ratio: JSBI

	if (baseToken.address < quoteToken.address) {
		ratio = FullMath.mulDivRoundingUp(ratioX192, baseAmount, shift)
	} else {
		ratio = FullMath.mulDivRoundingUp(shift, baseAmount, ratioX192)
	}

	return formatUnits(ratio.toString(), quoteToken.decimals)
}

export const getNearestUsableTick = (tick: number, tickSpacing: number) => {
	if (tickSpacing <= 0) {
		throw new Error("Tick spacing must be greater than 0")
	}

	if (tick < MIN_TICK || tick > MAX_TICK) {
		throw new Error("Tick out of bound")
	}

	const rounded = Math.round(tick / tickSpacing) * tickSpacing

	if (rounded < MIN_TICK) {
		return rounded + tickSpacing
	} else if (rounded > MAX_TICK) {
		return rounded - tickSpacing
	} else {
		return rounded
	}
}

export const getPriceFromTick = (tick: number, decimals0: number, decimals1: number, sorted: boolean) => {
	const sqrtRatioX96 = new bn(Math.pow(Math.sqrt(BASE_TICK), tick)).multipliedBy(Q96)

	const price = formatSqrtRatioX96(sqrtRatioX96, decimals0, decimals1)

	return !!sorted ? price : 1 / price
}

export const getTickFromPrice = (price: number, decimals0: number, decimals1: number, sorted: boolean, tickSpacing?: number): number => {
	let denominator: bn, numerator: bn

	if (!!sorted) {
		numerator = expandDecimals(price, decimals1)
		denominator = expandDecimals(1, decimals0)
	} else {
		numerator = expandDecimals(1, decimals1)
		denominator = expandDecimals(price, decimals0)
	}

	denominator = encodeSqrtRatioX96(denominator)
	numerator = encodeSqrtRatioX96(numerator)

	const sqrtRatioX96 = numerator
		.multipliedBy(Q96)
		.div(denominator)
		.div(Q96)
		.toNumber()

	const tick = Math.round(baseLog(Math.sqrt(BASE_TICK), sqrtRatioX96))

	return tickSpacing ? getNearestUsableTick(tick, tickSpacing) : tick
}

const baseLog = (x: number, y: number) => {
	return Math.log(y) / Math.log(x)
}

import { BigNumber, constants as _constants } from "ethers";
import JSBI from "jsbi";


const NEGATIVE_ONE = JSBI.BigInt(-1)
const ZERO = JSBI.BigInt(0)
const ONE = JSBI.BigInt(1)
const TWO = JSBI.BigInt(2)
const GWEI = JSBI.BigInt('1000000000')
const ETHER = JSBI.BigInt('1000000000000000000')
const MAX_UINT256 = JSBI.BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
const MAX_INT256 = JSBI.BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
const MAX_SAFE_INTEGER = JSBI.BigInt(Number.MAX_SAFE_INTEGER)
const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96))
const Q128 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128))
const Q192 = JSBI.exponentiate(Q96, JSBI.BigInt(2))

export const constants = {
	NEGATIVE_ONE,
	ZERO,
	ONE,
	TWO,
	GWEI,
	ETHER,
	MAX_UINT256,
	MAX_INT256,
	Q96,
	Q128,
	Q192,
}

export type BigNumberish = BigNumber | JSBI | number | string

export const toBI = (x: BigNumberish): JSBI => {
	if (x instanceof JSBI) return x
	if (typeof (x) !== "string") x = x.toString()

	return JSBI.BigInt(x)
}

export const mulDivRoundingUp = (x: JSBI, y: JSBI, denominator: JSBI): JSBI => {
	const product = JSBI.multiply(x, y)
	let result = JSBI.divide(product, denominator)

	if (JSBI.notEqual(JSBI.remainder(product, denominator), ZERO)) result = JSBI.add(result, ONE)

	return result
}

export const sqrt = (x: BigNumberish): JSBI => {
	if (!(x instanceof JSBI)) {
		x = toBI(x)
	}

	if (!JSBI.greaterThanOrEqual(x, ZERO)) {
		throw new Error("NEGATIVE VALUE")
	}

	if (JSBI.lessThan(x, MAX_SAFE_INTEGER)) {
		return JSBI.BigInt(Math.floor(Math.sqrt(JSBI.toNumber(x))))
	}

	let z: JSBI
	let y: JSBI
	z = x
	y = JSBI.add(JSBI.divide(x, TWO), ONE)

	while (JSBI.lessThan(y, z)) {
		z = y
		y = JSBI.divide(JSBI.add(JSBI.divide(x, y), y), TWO)
	}

	return z
}

const PERCENTAGE_FACTOR: BigNumber = BigNumber.from(1e4)
const HALF_PERCENT: BigNumber = PERCENTAGE_FACTOR.div(2)

export const percentMul = (value: BigNumberish, percentage: BigNumberish): BigNumber => {
	if (!BigNumber.isBigNumber(value)) {
		value = BigNumber.from(value)
	}

	if (!BigNumber.isBigNumber(percentage)) {
		percentage = BigNumber.from(percentage)
	}

	if (value.isZero() || percentage.isZero()) return _constants.Zero

	return value.lte(_constants.MaxUint256.sub(HALF_PERCENT).div(percentage))
		? value.mul(percentage).add(HALF_PERCENT).div(PERCENTAGE_FACTOR)
		: _constants.Zero
}

export const percentDiv = (value: BigNumberish, percentage: BigNumberish): BigNumber => {
	if (!BigNumber.isBigNumber(value)) {
		value = BigNumber.from(value)
	}

	if (!BigNumber.isBigNumber(percentage)) {
		percentage = BigNumber.from(percentage)
	}

	if (value.isZero() || percentage.isZero()) return _constants.Zero

	const halfPercentage = percentage.div(2)

	return value.lte(_constants.MaxUint256.sub(halfPercentage).div(PERCENTAGE_FACTOR))
		? value.mul(PERCENTAGE_FACTOR).add(halfPercentage).div(percentage)
		: _constants.Zero
}

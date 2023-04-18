import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { UNISWAP_V3_CONTRACTS } from "../constants/addresses";
import { PoolFee } from "../constants/enums";
import { TokenModel } from "../types";
import { getAddress } from "../utils/addresses";

import { PathCoder } from "./path";

import { IQuoterV2__factory, IUniswapV2Pair__factory } from "../../../typechain-types";


export interface QuoteResult<T extends string | string[]> {
	amount: string
	sqrtPriceX96After: T
	initializedTicksCrossed: T
	gasEstimate: string
}

export const exactInSingle = async (
	tokenIn: TokenModel,
	tokenOut: TokenModel,
	fee: PoolFee,
	amountIn: BigNumber,
	sqrtPriceLimitX96?: BigNumber
): Promise<QuoteResult<string>> => {
	const quoterV2 = IQuoterV2__factory.connect(UNISWAP_V3_CONTRACTS.QUOTER_V2, ethers.provider)

	const {
		amountOut,
		sqrtPriceX96After,
		initializedTicksCrossed,
		gasEstimate,
	} = await quoterV2.callStatic.quoteExactInputSingle({
		tokenIn: tokenIn.address,
		tokenOut: tokenOut.address,
		fee: fee,
		amountIn: amountIn,
		sqrtPriceLimitX96: sqrtPriceLimitX96 || "0",
	})

	const result: QuoteResult<string> = {
		amount: amountOut.toString(),
		sqrtPriceX96After: sqrtPriceX96After.toString(),
		initializedTicksCrossed: initializedTicksCrossed.toString(),
		gasEstimate: gasEstimate.toString(),
	}

	return result
}

export const exactIn = async (
	tokenAddresses: string[],
	poolFees: PoolFee[],
	amountIn: BigNumber
): Promise<QuoteResult<string[]>> => {
	const quoterV2 = IQuoterV2__factory.connect(UNISWAP_V3_CONTRACTS.QUOTER_V2, ethers.provider)

	const path = PathCoder.encode(tokenAddresses, poolFees)

	const {
		amountOut,
		sqrtPriceX96AfterList,
		initializedTicksCrossedList,
		gasEstimate,
	} = await quoterV2.callStatic.quoteExactInput(path, amountIn)

	const result: QuoteResult<string[]> = {
		amount: amountOut.toString(),
		sqrtPriceX96After: sqrtPriceX96AfterList.map((value) => value.toString()),
		initializedTicksCrossed: initializedTicksCrossedList.map((value) => value.toString()),
		gasEstimate: gasEstimate.toString(),
	}

	return result
}

export const exactOutSingle = async (
	tokenIn: TokenModel,
	tokenOut: TokenModel,
	fee: PoolFee,
	amountOut: BigNumber,
	sqrtPriceLimitX96?: BigNumber
): Promise<QuoteResult<string>> => {
	const quoterV2 = IQuoterV2__factory.connect(UNISWAP_V3_CONTRACTS.QUOTER_V2, ethers.provider)

	const {
		amountIn,
		sqrtPriceX96After,
		initializedTicksCrossed,
		gasEstimate,
	} = await quoterV2.callStatic.quoteExactOutputSingle({
		tokenIn: tokenIn.address,
		tokenOut: tokenOut.address,
		fee: fee,
		amount: amountOut,
		sqrtPriceLimitX96: sqrtPriceLimitX96 || "0"
	})

	const result: QuoteResult<string> = {
		amount: amountIn.toString(),
		sqrtPriceX96After: sqrtPriceX96After.toString(),
		initializedTicksCrossed: initializedTicksCrossed.toString(),
		gasEstimate: gasEstimate.toString(),
	}

	return result
}

export const exactOut = async (
	tokenAddresses: string[],
	poolFees: PoolFee[],
	amountOut: BigNumber
): Promise<QuoteResult<string[]>> => {
	const quoterV2 = IQuoterV2__factory.connect(UNISWAP_V3_CONTRACTS.QUOTER_V2, ethers.provider)

	const path = PathCoder.encode(tokenAddresses, poolFees)

	const {
		amountIn,
		sqrtPriceX96AfterList,
		initializedTicksCrossedList,
		gasEstimate,
	} = await quoterV2.callStatic.quoteExactOutput(path, amountOut)

	const result: QuoteResult<string[]> = {
		amount: amountIn.toString(),
		sqrtPriceX96After: sqrtPriceX96AfterList.map((value) => value.toString()),
		initializedTicksCrossed: initializedTicksCrossedList.map((value) => value.toString()),
		gasEstimate: gasEstimate.toString(),
	}

	return result
}

export const getAmountOut = async (
	pairAddress: string,
	tokenIn: string,
	tokenOut: string,
	amountIn: BigNumber
): Promise<BigNumber> => {
	const pair = IUniswapV2Pair__factory.connect(pairAddress, ethers.provider)

	const { reserve0, reserve1 } = await pair.getReserves()
	const [reserveIn, reserveOut] = getAddress(tokenIn) < getAddress(tokenOut)
		? [reserve0, reserve1]
		: [reserve1, reserve0]

	const amountInWithFee = amountIn.mul(997)
	const numerator = amountInWithFee.mul(reserveOut)
	const denominator = reserveIn.mul(1000).add(amountInWithFee)

	const amountOut = numerator.div(denominator)
	return amountOut
}

import { BigNumber, BigNumberish } from "ethers";

import { Assumption, Duration, PoolFee } from "../constants/enums";

import {
	IClient__factory,
	IDexAggregator__factory,
	ILendingDispatcher__factory,
	INFTForwarder__factory
} from "../../../typechain-types";


export const encodePullTokens = (
	token: string,
	amount: BigNumber
): string => {
	const itf = IClient__factory.createInterface()
	return itf.encodeFunctionData("pullTokens", [token, amount])
}

export const encodeSweepTokens = (
	token: string,
	amount: BigNumber,
	recipient: string
): string => {
	const itf = IClient__factory.createInterface()
	return itf.encodeFunctionData("sweepToken", [token, amount, recipient])
}

export const encodeMint = (
	assumption: Assumption,
	duration: Duration,
	token0: string,
	token1: string,
	fee: PoolFee,
	tickLower: number,
	tickUpper: number,
	amount0Desired: BigNumber,
	amount1Desired: BigNumber,
	amount0Min: BigNumberish,
	amount1Min: BigNumberish,
	deadline: BigNumberish,
	useEth: boolean
): string => {
	const params = {
		assumption,
		duration,
		token0,
		token1,
		fee,
		tickLower,
		tickUpper,
		amount0Desired,
		amount1Desired,
		amount0Min,
		amount1Min,
		deadline,
		useEth
	}

	const itf = INFTForwarder__factory.createInterface()
	return itf.encodeFunctionData("mint", [params])
}

export const encodeCollect = (tokenId: BigNumberish): string => {
	const itf = INFTForwarder__factory.createInterface()
	return itf.encodeFunctionData("collect", [tokenId])
}

export const encodeBurn = (tokenId: BigNumberish): string => {
	const itf = INFTForwarder__factory.createInterface()
	return itf.encodeFunctionData("burn", [tokenId])
}

export const encodeSwap = (
	routes: {
		adapterId: BigNumberish,
		pool: string,
		tokenIn: string,
		tokenOut: string
	}[],
	amountIn: BigNumber,
	amountOutMin: BigNumberish,
	deadline: BigNumberish
): string => {
	const itf = IDexAggregator__factory.createInterface()
	return itf.encodeFunctionData("swap", [
		routes,
		amountIn,
		amountOutMin,
		deadline
	])
}

export const encodeSupplyAndBorrow = (
	adapterId: BigNumberish,
	collateralToken: string,
	debtToken: string,
	collateralAmount: BigNumber,
	borrowAmount: BigNumber
): string => {
	const itf = ILendingDispatcher__factory.createInterface()
	return itf.encodeFunctionData("supplyAndBorrow", [
		adapterId,
		collateralToken,
		debtToken,
		collateralAmount,
		borrowAmount
	])
}

import { utils } from "ethers";
import { ethers } from "hardhat";

import { SUSHI_CONTRACTS, UNISWAP_V2_CONTRACTS } from "../constants/addresses";

import {
	IUniswapV2Factory,
	IUniswapV2Factory__factory,
	IUniswapV2Pair,
	IUniswapV2Pair__factory
} from "../../../typechain-types";


export interface PairState {
	reserve0: string
	reserve1: string
	blockTimestampLast: number
	price0CumulativeLast: string
	price1CumulativeLast: string
}

export const getPairState = async (pair: IUniswapV2Pair): Promise<PairState> => {
	const [{ reserve0, reserve1, blockTimestampLast }, price0CumulativeLast, price1CumulativeLast] = await Promise.all([
		pair.getReserves(),
		pair.price0CumulativeLast(),
		pair.price1CumulativeLast(),
	])

	const pairState: PairState = {
		reserve0: reserve0.toString(),
		reserve1: reserve1.toString(),
		blockTimestampLast: blockTimestampLast,
		price0CumulativeLast: price0CumulativeLast.toString(),
		price1CumulativeLast: price1CumulativeLast.toString()
	}

	return pairState
}

export const getPairWithMostLiquidity = async (token0Address: string, token1Address: string): Promise<IUniswapV2Pair | undefined> => {
	if (token0Address > token1Address) {
		;[token0Address, token1Address] = [token1Address, token0Address]
	}

	const uniFactory = getV2Factory("UNI-V2")
	const sushiFactory = getV2Factory("SLP")

	const [uniPairAddress, sushiPairAddress] = await Promise.all([
		uniFactory.getPair(token0Address, token1Address),
		sushiFactory.getPair(token0Address, token1Address),
	])

	let pair: IUniswapV2Pair | undefined

	if (!!uniPairAddress && !sushiPairAddress) {
		pair = getPairContract(uniPairAddress)
	} else if (!uniPairAddress && !!sushiPairAddress) {
		pair = getPairContract(sushiPairAddress)
	} else if (!!uniPairAddress && !!sushiPairAddress) {
		const uniPair = getPairContract(uniPairAddress)
		const sushiPair = getPairContract(sushiPairAddress)

		const [uniPairLiquidity, sushiPairLiquidity] = await Promise.all([
			uniPair.totalSupply(),
			sushiPair.totalSupply(),
		])

		pair = !!uniPairLiquidity.gt(sushiPairLiquidity) ? uniPair : sushiPair
	}

	return pair
}

const getV2Factory = (protocol: "UNI-V2" | "SLP"): IUniswapV2Factory => {
	const factoryAddress = protocol === "UNI-V2"
		? UNISWAP_V2_CONTRACTS.FACTORY
		: SUSHI_CONTRACTS.FACTORY

	const factory = IUniswapV2Factory__factory.connect(factoryAddress, ethers.provider)

	return factory
}

const getPairContract = (pairAddress: string): IUniswapV2Pair => {
	const pool = IUniswapV2Pair__factory.connect(pairAddress, ethers.provider)

	return pool
}

const UNI_PAIR_INIT_CODE_HASH = "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f"
const SUSHI_PAIR_INIT_CODE_HASH = "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303"

export const computePairAddress = (token0Address: string, token1Address: string, protocol: "UNI-V2" | "SLP") => {
	if (token0Address > token1Address) {
		;[token0Address, token1Address] = [token1Address, token0Address]
	}

	let factoryAddress: string
	let initCodeHash: string

	switch (protocol) {
		case "UNI-V2":
			factoryAddress = UNISWAP_V2_CONTRACTS.FACTORY
			initCodeHash = UNI_PAIR_INIT_CODE_HASH
			break

		case "SLP":
			factoryAddress = SUSHI_CONTRACTS.FACTORY
			initCodeHash = SUSHI_PAIR_INIT_CODE_HASH
			break
	}

	const salt = utils.keccak256(utils.solidityPack(["address", "address"], [token0Address, token1Address]))

	const pairAddress = utils.getCreate2Address(factoryAddress, salt, initCodeHash)

	return pairAddress
}

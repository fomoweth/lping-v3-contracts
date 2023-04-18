import { ethers } from "hardhat";
import { BigNumber, utils } from "ethers";

import { UNISWAP_V3_CONTRACTS } from "../constants/addresses";
import { PoolFee } from "../constants/enums";
import { TokenModel } from "../types";
import { getPriceFromTick } from "../utils/ticks";

import { IUniswapV3Factory__factory, IUniswapV3Pool, IUniswapV3Pool__factory } from "../../../typechain-types";


export interface PoolState {
	liquidity: string
	sqrtPriceX96: string
	tick: number
	observationIndex: string
	observationCardinality: string
	observationCardinalityNext: string
	feeProtocol: string
}

export const getPoolPrice = async (
	token0: TokenModel,
	token1: TokenModel,
	fee: PoolFee,
	period?: number
): Promise<{ x: number, y: number }> => {
	const factory = IUniswapV3Factory__factory.connect(UNISWAP_V3_CONTRACTS.FACTORY, ethers.provider)

	const poolAddress = await factory.getPool(token0.address, token1.address, fee)
	const pool = getPoolContract(poolAddress)

	let tick: number

	if (!!period) {
		tick = await getTwapTick(pool, period)
	} else {
		({ tick } = await pool.slot0())
	}

	const price = getPriceFromTick(tick, token0.decimals, token1.decimals, true)

	return { x: price, y: 1 / price }
}

export const getTwapTick = async (pool: IUniswapV3Pool, period: number): Promise<number> => {
	if (period <= 0) {
		throw new Error("Period must be greater than 0")
	}

	const { tickCumulatives } = await pool.observe([period, 0])

	const tickCumulativesDelta = +tickCumulatives[1].sub(tickCumulatives[0]).toString()

	let twapTick = tickCumulativesDelta / period

	if (tickCumulativesDelta < 0 && (tickCumulativesDelta % period != 0)) {
		twapTick--
	}

	return Math.round(twapTick)
}

export const getPoolState = async (pool: IUniswapV3Pool): Promise<PoolState> => {
	const [slot0, liquidity] = await Promise.all([
		pool.slot0(),
		pool.liquidity(),
	])

	const poolState: PoolState = {
		liquidity: liquidity.toString(),
		sqrtPriceX96: slot0.sqrtPriceX96.toString(),
		tick: slot0.tick,
		observationIndex: slot0.observationIndex.toString(),
		observationCardinality: slot0.observationCardinality.toString(),
		observationCardinalityNext: slot0.observationCardinalityNext.toString(),
		feeProtocol: slot0.feeProtocol.toString(),
	}

	return poolState
}

const POOL_FEES = Object.values(PoolFee).filter((fee) => typeof fee !== "string") as PoolFee[]

export const getPoolWithMostLiquidity = async (token0Address: string, token1Address: string): Promise<IUniswapV3Pool | undefined> => {
	if (token0Address > token1Address) {
		;[token0Address, token1Address] = [token1Address, token0Address]
	}

	const factory = IUniswapV3Factory__factory.connect(UNISWAP_V3_CONTRACTS.FACTORY, ethers.provider)

	let poolWithMostLiquidity: IUniswapV3Pool | undefined
	let mostLiquidity = BigNumber.from(0)

	for (const fee of POOL_FEES) {
		try {
			const poolAddress = await factory.getPool(token0Address, token1Address, fee)

			if (!!poolAddress) {
				const pool = getPoolContract(poolAddress)
				const liquidity = await pool.liquidity()

				if (!!liquidity.gt(mostLiquidity)) {
					poolWithMostLiquidity = pool
					mostLiquidity = liquidity
				}
			}

		} catch (e) { }
	}

	return poolWithMostLiquidity
}

const POOL_INIT_CODE_HASH = "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54"

export const computePoolAddress = (token0Address: string, token1Address: string, fee: PoolFee): string => {
	if (token0Address > token1Address) {
		;[token0Address, token1Address] = [token1Address, token0Address]
	}

	const salt = utils.keccak256(utils.defaultAbiCoder.encode(["address", "address", "uint24"], [token0Address, token1Address, fee]))

	const poolAddress = utils.getCreate2Address(UNISWAP_V3_CONTRACTS.FACTORY, salt, POOL_INIT_CODE_HASH)

	return poolAddress
}

export const getPoolContract = (poolAddress: string): IUniswapV3Pool => {
	const pool = IUniswapV3Pool__factory.connect(poolAddress, ethers.provider)

	return pool
}

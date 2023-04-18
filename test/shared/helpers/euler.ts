import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { EULER_CONTRACTS } from "../constants/addresses";
import { Assumption } from "../constants/enums";
import { TokenModel } from "../types";
import { isWrappedNative } from "../utils/addresses";
import { percentDiv, percentMul } from "../utils/bn";
import { parseUnits } from "../utils/units";

import {
	IDToken,
	IDToken__factory,
	IEToken,
	IEToken__factory,
	IEulerGeneralView__factory,
	IEulerSimpleLens__factory,
	IMarkets__factory,
} from "../../../typechain-types";


const COLLATERAL_FACTOR_SCALE = 10000
const EULER_FACTOR_SCALE = 400000

type PricingType = "pegged" | "v3_twap" | "forwarded" | "chainlink"

export interface EulerAssetConfig {
	eTokenAddress: string
	dTokenAddress: string
	borrowIsolated: boolean
	collateralFactor: number
	borrowFactor: number
	twapWindow: number
	pricingType: PricingType
	chainlinkAggregator: string
}

export const getCollateralAndBorrowAmounts = async (
	assumption: Assumption,
	collateralAsset: TokenModel,
	borrowAsset: TokenModel,
	tokenAmount: BigNumber,
	debtRatio: number
) => {
	if (!isWrappedNative(collateralAsset.address) && !isWrappedNative(borrowAsset.address)) {
		throw new Error("!WETH")
	}

	const token = !!isWrappedNative(collateralAsset.address) ? borrowAsset : collateralAsset

	const [
		{ collateralFactor },
		{ borrowFactor },
		{ price: tokenPrice }
	] = await Promise.all([
		getAssetConfig(collateralAsset.address),
		getAssetConfig(borrowAsset.address),
		getUnderlyingPrice(token.address)
	])

	if (collateralFactor / EULER_FACTOR_SCALE === 0) {
		throw new Error("Invalid collateral asset")
	}

	const scale = 18 - Math.abs(collateralAsset.decimals - borrowAsset.decimals)
	const maxRatio = collateralFactor * borrowFactor / COLLATERAL_FACTOR_SCALE
	const borrowRatio = Math.round(maxRatio * debtRatio / COLLATERAL_FACTOR_SCALE)
	const collateralRatio = borrowRatio + COLLATERAL_FACTOR_SCALE

	let collateralAmount: BigNumber
	let borrowAmount: BigNumber

	switch (assumption) {
		case Assumption.BEARISH:
			collateralAmount = tokenAmount
			break

		case Assumption.NEUTRAL:
			collateralAmount = percentDiv(tokenAmount, collateralRatio)
			break

		default:
			throw new Error("Invalid assumption")
	}

	if (!!isWrappedNative(collateralAsset.address)) {
		borrowAmount = percentMul(collateralAmount, borrowRatio).mul(parseUnits(1, scale)).div(tokenPrice)
	} else {
		borrowAmount = percentMul(collateralAmount, borrowRatio).mul(tokenPrice).div(parseUnits(1, scale))
	}

	return { collateralAmount, borrowAmount }
}

export const getAssetConfig = async (tokenAddress: string): Promise<EulerAssetConfig> => {
	const markets = IMarkets__factory.connect(EULER_CONTRACTS.MARKETS, ethers.provider)

	const [assetConfig, dTokenAddress, pricingConfig, chainlinkAggregator] = await Promise.all([
		markets.underlyingToAssetConfig(tokenAddress),
		markets.underlyingToDToken(tokenAddress),
		markets.getPricingConfig(tokenAddress),
		markets.getChainlinkPriceFeedConfig(tokenAddress),
	])

	let pricingType: PricingType

	switch (pricingConfig.pricingType) {
		case 1:
			pricingType = "pegged"
			break

		case 2:
			pricingType = "v3_twap"
			break

		case 3:
			pricingType = "forwarded"
			break

		case 4:
			pricingType = "chainlink"
			break

		default:
			throw new Error("Invalid pricing type")
	}

	return {
		eTokenAddress: assetConfig.eTokenAddress,
		dTokenAddress: dTokenAddress,
		borrowIsolated: assetConfig.borrowIsolated,
		collateralFactor: assetConfig.collateralFactor / EULER_FACTOR_SCALE,
		borrowFactor: assetConfig.borrowFactor / EULER_FACTOR_SCALE,
		twapWindow: assetConfig.twapWindow,
		pricingType: pricingType,
		chainlinkAggregator: chainlinkAggregator,
	}
}

export const getUnderlyingPrice = async (tokenAddress: string): Promise<{ twap: BigNumber, twapPeriod: BigNumber, price: BigNumber }> => {
	const simpleLens = IEulerSimpleLens__factory.connect(EULER_CONTRACTS.SIMPLE_LENS, ethers.provider)

	const { twap, twapPeriod, currPrice } = await simpleLens.getPriceFull(tokenAddress)

	return { twap, twapPeriod, price: currPrice }
}

export const getApys = async (tokenAddress: string): Promise<{ borrowApy: BigNumber, supplyApy: BigNumber }> => {
	const markets = IMarkets__factory.connect(EULER_CONTRACTS.MARKETS, ethers.provider)
	const view = IEulerGeneralView__factory.connect(EULER_CONTRACTS.GENERAL_VIEW, ethers.provider)

	const { eTokenAddress, dTokenAddress } = await getAssetConfig(tokenAddress)

	const eToken = getEToken(eTokenAddress)
	const dToken = getDToken(dTokenAddress)

	const [totalBorrows, totalBalances, reserveFee, borrowSPY] = await Promise.all([
		dToken.totalSupply(),
		eToken.totalSupplyUnderlying(),
		markets.reserveFee(tokenAddress),
		markets.interestRate(tokenAddress)
	])

	const { borrowAPY, supplyAPY } = await view.computeAPYs(borrowSPY, totalBorrows, totalBalances, reserveFee)

	return { borrowApy: borrowAPY, supplyApy: supplyAPY }
}

export const getEToken = (eTokenAddress: string): IEToken => {
	const eToken = IEToken__factory.connect(eTokenAddress, ethers.provider)

	return eToken
}

export const getDToken = (dTokenAddress: string): IDToken => {
	const dToken = IDToken__factory.connect(dTokenAddress, ethers.provider)

	return dToken
}

import { JsonRpcProvider } from "@ethersproject/providers";
import { PairType, PoolFee } from "../constants/enums";


export type Mapping<T> = Record<string, T>

export type Provider = JsonRpcProvider

export interface TokenModel {
	chainId: number
	address: string
	name: string
	symbol: string
	decimals: number
	logoURI?: string
}

export interface PoolModel {
	address: string
	name: string
	tokens: TokenModel[]
	fee: PoolFee
}

export interface PairModel {
	address: string
	name: string
	type: PairType
	tokens: TokenModel[]
}

export interface MarketModel {
	underlying: string
	eToken: string
	dToken: string
	tier: "collateral" | "cross" | "isolated"
}

export interface FeedModel {
	name: string
	category: string
	path: string
	base: string
	quote: string
	decimals: number
	contractAddress: string
	proxyAddress: string | null
}

export interface UniswapV3Config {
	FACTORY: string
	NFT: string
	QUOTER_V2: string
	ROUTER: string
	ROUTER02: string
}

export interface UniswapV2Config {
	FACTORY: string
	ROUTER: string
}

export interface EulerConfig {
	EULER: string
	MARKETS: string
	LIQUIDATION: string
	EXEC: string
	FLASHLOAN: string
	GENERAL_VIEW: string
	SIMPLE_LENS: string
	EUL: string
}

import { PairType } from "../constants/enums";
import { FeedModel, MarketModel, PairModel, PoolModel, TokenModel } from "../types";
import { isAddress, isSameAddress } from "../utils/addresses";

import feeds from "./feeds.json";
import markets from "./markets.json";
import pairs from "./pairs.json";
import pools from "./pools.json";
import tokens from "./tokens.json";


const FEEDS = JSON.parse(JSON.stringify(feeds, null, 4)) as FeedModel[]
const MARKETS = JSON.parse(JSON.stringify(markets, null, 4)) as MarketModel[]
const PAIRS = JSON.parse(JSON.stringify(pairs, null, 4)) as PairModel[]
const POOLS = JSON.parse(JSON.stringify(pools, null, 4)) as PoolModel[]
const TOKENS = JSON.parse(JSON.stringify(tokens, null, 4)) as TokenModel[]

export const getFeed = (target: string): FeedModel => {
	const feed = FEEDS.find((feed) => !isAddress(target)
		? feed.name.toUpperCase() === target.toUpperCase()
		: !!isSameAddress(feed.contractAddress, target) ||
		(!!feed.proxyAddress && !!isSameAddress(feed.proxyAddress, target))
	)

	if (!feed) {
		throw new Error("Feed not found")
	}

	return feed
}

export const getMarket = (target: string) => {
	const underlying = getToken(target)

	const market = MARKETS.find((market) => !!isSameAddress(market.underlying, underlying.address))

	if (!market) {
		throw new Error("Market not found")
	}

	return market
}

export const getPairs = (targets: string[], type?: PairType) => {
	const pairs = !!type ? PAIRS.filter((pair) => pair.type === type) : PAIRS

	if (targets.length === 0) {
		return pairs
	}

	if (!type) {
		const result: PairModel[] = []

		for (const target of targets) {
			for (const pair of pairs) {
				if (!!isAddress(target)) {
					if (!!isSameAddress(pair.address, target)) {
						result.push(pair)
					}
				} else {
					if (pair.name.toUpperCase() === target.toUpperCase()) {
						result.push(pair)
					}
				}
			}
		}

		return result
	} else {
		return targets.reduce<PairModel[]>((acc, target) => {
			const pair = pairs.find((pair) => !!isAddress(target)
				? !!isSameAddress(pair.address, target)
				: pair.name.toUpperCase() === target.toUpperCase()
			)

			if (!pair) {
				throw new Error("Pair not found")
			}

			acc.push(pair)

			return acc
		}, [])
	}
}

export const getPair = (target: string, type?: PairType) => {
	const [pair] = getPairs([target], type)

	return pair
}

export const getPools = (targets: string[]) => {
	if (targets.length === 0) {
		return POOLS
	}

	return targets.reduce<PoolModel[]>((acc, target) => {
		const pool = POOLS.find((pool) => !!isAddress(target)
			? !!isSameAddress(pool.address, target)
			: pool.name.toUpperCase() === target.toUpperCase()
		)

		if (!pool) {
			throw new Error("Pool not found")
		}

		acc.push(pool)

		return acc
	}, [])
}

export const getPool = (target: string) => {
	const [pool] = getPools([target])

	return pool
}

export const getTokens = (targets: string[]) => {
	if (targets.length === 0) {
		return TOKENS
	}

	return targets.reduce<TokenModel[]>((acc, target) => {
		const token = TOKENS.find((token) =>
			!!isAddress(target)
				? !!isSameAddress(target, token.address)
				: target.toUpperCase() === token.symbol.toUpperCase()
		)

		if (!token) {
			throw new Error("Token not found")
		}

		acc.push(token)

		return acc
	}, [])
}

export const getToken = (target: string) => {
	const [token] = getTokens([target])

	return token
}

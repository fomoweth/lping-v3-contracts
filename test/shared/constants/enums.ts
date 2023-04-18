export enum AdapterId {
	NONE,
	V3_SWAP,
	V2_SWAP,
	EULER_ADAPTER,
}

export enum Action {
	ADD,
	REMOVE,
	Replace,
}

export enum AdapterType {
	NONE,
	SWAP,
	LEND,
}

export enum Assumption {
	BULLISH,
	BEARISH,
	NEUTRAL
}

export enum Duration {
	DAY,
	WEEK,
	MONTH,
	YEAR
}

export enum PairType {
	V2 = "UNI-V2",
	SLP = "SLP"
}

export enum PoolFee {
	LOWEST = 100,
	LOW = 500,
	MEDIUM = 3000,
	HIGH = 10000
}

export const TICK_SPACING: { [amount in PoolFee]: number } = {
	[PoolFee.LOWEST]: 1,
	[PoolFee.LOW]: 10,
	[PoolFee.MEDIUM]: 60,
	[PoolFee.HIGH]: 200,
}

export const SCALING_FACTOR: { [duration in Duration]: number } = {
	[Duration.DAY]: 1.065,
	[Duration.WEEK]: 1.175,
	[Duration.MONTH]: 1.4,
	[Duration.YEAR]: 3.25,
}

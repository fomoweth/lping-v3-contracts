import "dotenv/config";


export interface EnvConfig {
	readonly ALCHEMY_API_KEY: string
	readonly CMC_API_KEY: string
	readonly ETHERSCAN_API_KEY: string
	readonly MNEMONIC: string
	readonly FORK_BLOCK_NUMBER: string | undefined
	readonly ENABLE_GAS_REPORT: boolean
}

const getEnvKey = (key: string, value: string | undefined, optional: boolean) => {
	if (!optional && !value) {
		throw new Error(`Missing environment variable: ${key}`)
	}

	return value
}

export const ENV_CONFIG: EnvConfig = {
	ALCHEMY_API_KEY: getEnvKey("ALCHEMY_API_KEY", process.env.ALCHEMY_API_KEY, false)!,
	CMC_API_KEY: getEnvKey("CMC_API_KEY", process.env.CMC_API_KEY, false)!,
	ETHERSCAN_API_KEY: getEnvKey("ETHERSCAN_API_KEY", process.env.ETHERSCAN_API_KEY, false)!,
	MNEMONIC: getEnvKey("MNEMONIC", process.env.MNEMONIC, true) || "test test test test test test test test test test test junk",
	FORK_BLOCK_NUMBER: getEnvKey("FORK_BLOCK_NUMBER", process.env.FORK_BLOCK_NUMBER, true),
	ENABLE_GAS_REPORT: getEnvKey("ENABLE_GAS_REPORT", process.env.ENABLE_GAS_REPORT, true) === "true",
}

export const RPC_URL = "https://eth-mainnet.alchemyapi.io/v2/".concat(ENV_CONFIG.ALCHEMY_API_KEY)

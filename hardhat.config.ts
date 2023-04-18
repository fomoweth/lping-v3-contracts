import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-tracer";

import { ENV_CONFIG, RPC_URL } from "./config";


const config: HardhatUserConfig = {
	paths: {
		artifacts: "./artifacts",
		cache: "./cache",
		sources: "./contracts",
		tests: "./test",
	},
	solidity: {
		compilers: [
			{
				version: "0.8.15",
				settings: {
					viaIR: true,
					evmVersion: "istanbul",
					optimizer: {
						enabled: true,
						runs: 1_000_000,
					},
					metadata: {
						bytecodeHash: "none",
					},
				},
			}
		],
	},
	networks: {
		hardhat: {
			allowUnlimitedContractSize: false,
			chainId: 1,
			forking: {
				url: RPC_URL,
				blockNumber: !!ENV_CONFIG.FORK_BLOCK_NUMBER ? +ENV_CONFIG.FORK_BLOCK_NUMBER : undefined,
			},
			accounts: {
				mnemonic: ENV_CONFIG.MNEMONIC,
				initialIndex: 0,
				count: 20,
				path: "m/44'/60'/0'/0",
			},
		},
		mainnet: {
			chainId: 1,
			url: RPC_URL,
		},
	},
	etherscan: {
		apiKey: ENV_CONFIG.ETHERSCAN_API_KEY
	},
	gasReporter: {
		enabled: ENV_CONFIG.ENABLE_GAS_REPORT,
		coinmarketcap: ENV_CONFIG.CMC_API_KEY,
		currency: "USD",
	},
	contractSizer: {
		alphaSort: true,
		disambiguatePaths: false,
		runOnCompile: true,
		strict: true,
	},
	mocha: {
		timeout: 60000,
	},
	namedAccounts: {
		deployer: {
			default: 0
		},
	},
};

export default config;

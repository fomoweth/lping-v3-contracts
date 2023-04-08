import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-tracer";


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
	tracer: {
		enabled: false,
		logs: true,
		calls: true,
		sstores: false,
		sloads: false,
		gasCost: true,
	},
};

export default config;

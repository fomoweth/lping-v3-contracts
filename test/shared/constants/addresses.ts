import { EulerConfig, UniswapV2Config, UniswapV3Config } from "../types";


export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
export const NATIVE_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
export const BTC_QUOTE = "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
export const USD_QUOTE = "0x0000000000000000000000000000000000000348"

export const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
export const STETH_ADDRESS = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"
export const WSTETH_ADDRESS = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"

export const WBTC_ADDRESS = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"

export const UNISWAP_V3_CONTRACTS: UniswapV3Config = {
	FACTORY: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
	NFT: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
	QUOTER_V2: "0x0209c4Dc18B2A1439fD2427E34E7cF3c6B91cFB9",
	ROUTER: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
	ROUTER02: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
}

export const UNISWAP_V2_CONTRACTS: UniswapV2Config = {
	FACTORY: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
	ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
}

export const SUSHI_CONTRACTS: UniswapV2Config = {
	FACTORY: "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
	ROUTER: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
}

export const EULER_CONTRACTS: EulerConfig = {
	EULER: "0x27182842E098f60e3D576794A5bFFb0777E025d3",
	MARKETS: "0x3520d5a913427E6F0D6A83E07ccD4A4da316e4d3",
	LIQUIDATION: "0xf43ce1d09050BAfd6980dD43Cde2aB9F18C85b34",
	EXEC: "0x59828FdF7ee634AaaD3f58B19fDBa3b03E2D9d80",
	FLASHLOAN: "0xCD04c09a16fC4E8DB47C930AC90C89f79F20aEB4",
	GENERAL_VIEW: "0xACC25c4d40651676FEEd43a3467F3169e3E68e42",
	SIMPLE_LENS: "0x5077B7642abF198b4a5b7C4BdCE4f03016C7089C",
	EUL: "0xd9fcd98c322942075a5c3860693e9f4f03aae07b",
}

export const FEED_REGISTRY = "0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf"
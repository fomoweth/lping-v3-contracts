import { utils } from "ethers";

import { NATIVE_ADDRESS, WETH_ADDRESS } from "../constants/addresses";

export const { getAddress, isAddress } = utils

export const isSameAddress = (x: string, y: string): boolean => {
	return getAddress(x) === getAddress(y)
}

export const isNative = (tokenAddress: string): boolean => {
	return !!isSameAddress(tokenAddress, NATIVE_ADDRESS)
}

export const isWrappedNative = (tokenAddress: string): boolean => {
	return !!isSameAddress(tokenAddress, WETH_ADDRESS)
}

export const sortTokens = (tokenAddresses: string[]): string[] => {
	return tokenAddresses.sort((a, b) => getAddress(a) < getAddress(b) ? -1 : 1)
}
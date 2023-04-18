import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getStorageAt, setStorageAt } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish } from "ethers";

import { STETH_ADDRESS, WETH_ADDRESS, WSTETH_ADDRESS, ZERO_ADDRESS } from "../constants/addresses";
import { getLatestAnswerETH } from "../helpers/chainlink";
import { TokenModel } from "../types";

import { encode, keccak256 } from "./bytes";
import { parseUnits } from "./units";

import {
	IERC20Metadata__factory,
	ISTETH__factory,
	IWETH__factory,
	IWSTETH__factory
} from "../../../typechain-types";


export const seedTokens = async (token: TokenModel, slot: number, ethAmount: BigNumberish, accounts: string[]) => {
	if (!BigNumber.isBigNumber(ethAmount)) {
		ethAmount = parseUnits(ethAmount)
	}

	const tokenPrice = await getLatestAnswerETH(token.address)
	const unit = parseUnits("1", token.decimals)
	const seedAmount = ethAmount.mul(unit).div(tokenPrice)
	const value = encode(["uint256"], [seedAmount])

	for (const account of accounts) {
		const probedSlot = keccak256(encode(["address", "uint256"], [account, slot]))

		await setStorageAt(token.address, probedSlot, value)
	}
}

export const getBalanceSlot = async (tokenAddress: string) => {
	const token = IERC20Metadata__factory.connect(tokenAddress, ethers.provider)

	for (let i = 0; i < 100; i++) {
		let balanceSlot = keccak256(encode(["address", "uint256"], [ZERO_ADDRESS, i]))

		while (balanceSlot.startsWith("0x0")) balanceSlot = "0x" + balanceSlot.slice(3)

		const valuePrior = await getStorageAt(token.address, balanceSlot)
		const balanceToTest = valuePrior === encode(["uint256"], [10]) ? encode(["uint256"], [2]) : encode(["uint256"], [10])

		await setStorageAt(token.address, balanceSlot, balanceToTest)

		const balance = await token.balanceOf(ZERO_ADDRESS)

		if (!balance.eq(BigNumber.from(balanceToTest)))
			await setStorageAt(token.address, balanceSlot, valuePrior)

		if (balance.eq(BigNumber.from(balanceToTest))) return i
	}

	throw new Error("Balance slot not found")
}

export const wrapETH = async (signer: SignerWithAddress, amount: BigNumber) => {
	const weth = IWETH__factory.connect(WETH_ADDRESS, signer)
	await weth.deposit({ value: amount })

	const wrappedAmount = await weth.balanceOf(signer.address)

	if (!wrappedAmount.gt(0)) {
		throw new Error("Failed to wrap ETH")
	}
}

export const stakeETH = async (signer: SignerWithAddress, amount: BigNumber) => {
	const stEth = ISTETH__factory.connect(STETH_ADDRESS, signer)
	await stEth.submit(ZERO_ADDRESS, { value: amount })

	const stakedAmount = await stEth.balanceOf(signer.address)

	if (!stakedAmount.gt(0)) {
		throw new Error("Failed to stake ETH")
	}
}

export const wrapStETH = async (signer: SignerWithAddress, amount?: BigNumber) => {
	const stEth = ISTETH__factory.connect(STETH_ADDRESS, signer)
	const wstEth = IWSTETH__factory.connect(WSTETH_ADDRESS, signer)

	if (amount) {
		await stEth.submit(ZERO_ADDRESS, { value: amount })
	}

	const stakedAmount = await stEth.balanceOf(signer.address)

	await stEth.approve(WSTETH_ADDRESS, stakedAmount)
	await wstEth.wrap(stakedAmount)

	const wrappedAmount = await wstEth.balanceOf(signer.address)

	if (!wrappedAmount.gt(0)) {
		throw new Error("Failed to wrap stETH")
	}
}

export const unwrapStETH = async (signer: SignerWithAddress) => {
	const stEth = ISTETH__factory.connect(STETH_ADDRESS, signer)
	const wstEth = IWSTETH__factory.connect(WSTETH_ADDRESS, signer)

	const balanceBefore = await stEth.balanceOf(signer.address)
	const wrappedAmount = await wstEth.balanceOf(signer.address)

	await wstEth.unwrap(wrappedAmount)

	const balanceAfter = await stEth.balanceOf(signer.address)

	if (!balanceAfter.gt(balanceBefore)) {
		throw new Error("Failed to unwrap wstETH")
	}
}

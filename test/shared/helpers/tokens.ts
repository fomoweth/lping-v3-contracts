import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, constants } from "ethers";
import { ethers } from "hardhat";

import { IERC20Metadata, IERC20Metadata__factory } from "../../../typechain-types";


export const approve = async (tokenAddress: string, spenderAddress: string, signer: SignerWithAddress, amount?: BigNumber): Promise<void> => {
	if (!amount) amount = constants.MaxUint256

	const token = getTokenContract(tokenAddress, signer)
	await token.approve(spenderAddress, amount)

	const allowance = await getAllowance(tokenAddress, spenderAddress, signer.address)

	if (!allowance.gt(0)) {
		throw new Error("Failed to approve tokens")
	}
}

export const transfer = async (tokenAddress: string, amount: BigNumber, recipientAddress: string, signer: SignerWithAddress): Promise<void> => {
	const balanceBefore = await getBalance(tokenAddress, recipientAddress)

	const token = getTokenContract(tokenAddress, signer)
	await token.transfer(recipientAddress, amount)

	const balanceAfter = await getBalance(tokenAddress, recipientAddress)

	if (!balanceAfter.sub(balanceBefore).eq(amount)) {
		throw new Error("Failed to transfer tokens")
	}
}

export const getAllowance = async (tokenAddress: string, spenderAddress: string, ownerAddress: string): Promise<BigNumber> => {
	const token = getTokenContract(tokenAddress)
	return await token.allowance(ownerAddress, spenderAddress)
}

export const getAllowances = async (tokenAddress: string, spenderAddress: string, ownerAddresses: string[]): Promise<BigNumber[]> => {
	return await Promise.all(
		ownerAddresses.map(async (ownerAddress) => await getAllowance(tokenAddress, spenderAddress, ownerAddress))
	)
}

export const getBalance = async (tokenAddress: string, accountAddress: string): Promise<BigNumber> => {
	const token = getTokenContract(tokenAddress)
	return await token.balanceOf(accountAddress)
}

export const getBalances = async (tokenAddress: string, accountAddresses: string[]): Promise<BigNumber[]> => {
	return await Promise.all(
		accountAddresses.map(async (accountAddress) => await getBalance(tokenAddress, accountAddress))
	)
}

export const getTokenContract = (tokenAddress: string, signer?: SignerWithAddress): IERC20Metadata => {
	return IERC20Metadata__factory.connect(tokenAddress, signer || ethers.provider)
}

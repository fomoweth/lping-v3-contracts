import { ethers } from "hardhat";

export const getBlockTimestamp = async (blockNumber?: number) => {
	const block = await ethers.provider.getBlock(blockNumber ?? "latest")
	if (!block) {
		throw new Error(`Failed to fetch block on: ${blockNumber}`)
	}

	return block.timestamp
}

export const setDeadline = async (seconds: number = 60) => {
	return await getBlockTimestamp() + seconds
}

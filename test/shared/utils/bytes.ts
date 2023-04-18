import { utils } from "ethers";


export const formatBytes32 = (key: string) => {
	return utils.formatBytes32String(key)
}

export const parseBytes32 = (data: utils.BytesLike) => {
	return utils.parseBytes32String(data)
}

export const keccak256 = (data: utils.BytesLike) => {
	return utils.keccak256(data)
}

export const encode = (types: string[], values: any[]) => {
	return utils.defaultAbiCoder.encode(types, values)
}

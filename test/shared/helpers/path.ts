import { PoolFee } from "../constants/enums";
import { getAddress } from "../utils/addresses";


const ADDR_SIZE = 20
const FEE_SIZE = 3
const OFFSET = ADDR_SIZE + FEE_SIZE
const DATA_SIZE = OFFSET + ADDR_SIZE

export abstract class PathCoder {

	protected constructor() { }

	public static encode(tokenAddresses: string[], fees: PoolFee[]) {
		if (tokenAddresses.length - 1 !== fees.length) {
			throw new Error("Invalid path length")
		}

		let path = "0x"
		for (let i = 0; i < fees.length; i++) {
			path += tokenAddresses[i].slice(2)
			path += fees[i].toString(16).padStart(2 * FEE_SIZE, "0")
		}

		path += tokenAddresses[tokenAddresses.length - 1].slice(2)

		return path.toLowerCase()
	}

	public static decode(path: string) {
		let data = Buffer.from(path.slice(2), "hex")

		let tokens: string[] = []
		let fees: number[] = []
		let i = 0
		let tokenOut: string = ""

		while (data.length >= DATA_SIZE) {
			const { tokenA, tokenB, fee } = PathCoder.decodeFirstPool(data)
			tokenOut = tokenB
			tokens = [...tokens, tokenA]
			fees = [...fees, fee]
			data = data.slice((i + 1) * OFFSET)
			i += 1
		}

		tokens = [...tokens, tokenOut]

		return { tokenAddresses: tokens, fees }
	}

	public static decodeFirstPool(path: Buffer) {
		const _tokenA = path.slice(0, ADDR_SIZE)
		const tokenA = getAddress("0x" + _tokenA.toString("hex"))

		const _fee = path.slice(ADDR_SIZE, OFFSET)
		const fee = _fee.readUIntBE(0, FEE_SIZE)

		const _tokenB = path.slice(OFFSET, DATA_SIZE)
		const tokenB = getAddress("0x" + _tokenB.toString("hex"))

		return { tokenA, tokenB, fee }
	}
}

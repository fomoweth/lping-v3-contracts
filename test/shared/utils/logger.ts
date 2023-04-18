import chalk from "chalk";
import { BigNumber } from "ethers";
import JSBI from "jsbi";


const replacer = (_: string, value: any) => {
	if (!!value && typeof value === "object") {
		if (!Array.isArray(value)) {
			const obj = Object.assign({}, value)

			Object.entries(value).forEach(([key, val]) => {
				if (!!BigNumber.isBigNumber(val) || val instanceof JSBI) {
					val = val.toString()
				}

				obj[key] = val
			})

			return obj
		} else {
			return value.map((v) => !!BigNumber.isBigNumber(v) ? v.toString() : v)
		}
	} else {
		return value
	}
}

export class Logger {
	public log(title: string, ...args: any[]) {
		const parsedArgs = args.map(arg => {
			if (typeof arg === "object" && arg != null) {
				return JSON.stringify(arg, replacer, 4).replace(/"/g, "")
			} else {
				return arg
			}
		})

		console.log(``)
		console.log(`${chalk.green(title)}: `, ...parsedArgs)
		console.log(``)
	}
}

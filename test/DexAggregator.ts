import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";

import { completeFixture } from "./shared/env/fixtures";
import { initTestEnv } from "./shared/env/testEnv";
import { encodePullTokens, encodeSwap, encodeSweepTokens } from "./shared/helpers/encoder";
import { exactInSingle, getAmountOut } from "./shared/helpers/quoter";
import { approve, getBalance } from "./shared/helpers/tokens";
import { getPairs, getPools } from "./shared/schema";
import { isSameAddress } from "./shared/utils/addresses";
import { getBalanceSlot, seedTokens } from "./shared/utils/funds";
import { setDeadline } from "./shared/utils/time";
import { parseUnits } from "./shared/utils/units";


initTestEnv({ title: "DexAggregator", tracer: { enabled: false } })
	.set({
		desc: "should successfully execute swap on V3 pools via DexAggregator",
		action: async () => {
			const poolNames = [
				"WBTC-WETH/500",
				"UNI-WETH/3000",
				"LINK-WETH/3000",
				"MATIC-WETH/3000"
			]

			const pools = getPools(poolNames)

			const ethAmount = parseUnits("5")

			for (const pool of pools) {
				const {
					traders,
					clients,
					adapters: { v3Swap }
				} = await loadFixture(completeFixture)

				const [token0, token1] = pool.tokens

				for (let i = 0; i < 2; i++) {
					const client = clients[i]
					const ownerAddress = await client.getOwner()
					const trader = traders.find((trader) => !!isSameAddress(trader.address, ownerAddress))!

					const zeroForOne = i === 0

					const [tokenIn, tokenOut] = !!zeroForOne
						? [token0, token1]
						: [token1, token0]

					const slot = await getBalanceSlot(tokenIn.address)

					await seedTokens(tokenIn, slot, ethAmount, [trader.address])

					const amountIn = await getBalance(tokenIn.address, trader.address)
					expect(amountIn).to.be.gt(0)

					const { amount: _quoteAmount } = await exactInSingle(
						tokenIn,
						tokenOut,
						pool.fee,
						amountIn
					)

					const quoteAmount = BigNumber.from(_quoteAmount)

					await approve(tokenIn.address, client.address, trader)

					const deadline = await setDeadline()

					const payloads: string[] = [
						encodePullTokens(tokenIn.address, amountIn),
						encodeSwap(
							[
								{
									adapterId: await v3Swap.id(),
									pool: pool.address,
									tokenIn: tokenIn.address,
									tokenOut: tokenOut.address
								}
							],
							amountIn,
							quoteAmount,
							deadline
						),
						encodeSweepTokens(
							tokenOut.address,
							quoteAmount,
							trader.address
						)
					]

					const tx = await client.connect(trader).multicall(payloads)
					await tx.wait()

					const amountOut = await getBalance(tokenOut.address, trader.address)
					expect(amountOut).to.be.eq(quoteAmount)
				}
			}
		}
	})
	.set({
		desc: "should successfully execute swap on V2 pools via DexAggregator",
		action: async () => {
			const pairNames = [
				"WBTC-WETH",
				"UNI-WETH",
				"LINK-WETH",
				"MATIC-WETH"
			]

			const pairs = getPairs(pairNames)

			const ethAmount = parseUnits("5")

			for (const pair of pairs) {
				const {
					traders,
					clients,
					adapters: { v2Swap }
				} = await loadFixture(completeFixture)

				const [token0, token1] = pair.tokens

				for (let i = 0; i < 2; i++) {
					const client = clients[i]
					const ownerAddress = await client.getOwner()
					const trader = traders.find((trader) => !!isSameAddress(trader.address, ownerAddress))!

					const zeroForOne = i === 0

					const [tokenIn, tokenOut] = !!zeroForOne
						? [token0, token1]
						: [token1, token0]

					const slot = await getBalanceSlot(tokenIn.address)

					await seedTokens(tokenIn, slot, ethAmount, [trader.address])

					const amountIn = await getBalance(tokenIn.address, trader.address)
					expect(amountIn).to.be.gt(0)

					const quoteAmount = await getAmountOut(pair.address, tokenIn.address, tokenOut.address, amountIn)

					await approve(tokenIn.address, client.address, trader)

					const deadline = await setDeadline()

					const payloads: string[] = [
						encodePullTokens(
							tokenIn.address,
							amountIn
						),
						encodeSwap(
							[
								{
									adapterId: await v2Swap.id(),
									pool: pair.address,
									tokenIn: tokenIn.address,
									tokenOut: tokenOut.address
								}
							],
							amountIn,
							quoteAmount,
							deadline
						),
						encodeSweepTokens(
							tokenOut.address,
							quoteAmount,
							trader.address
						)
					]

					const tx = await client.connect(trader).multicall(payloads)
					await tx.wait()

					const amountOut = await getBalance(tokenOut.address, trader.address)
					expect(amountOut).to.be.eq(quoteAmount)
				}
			}
		}
	})
	.run()

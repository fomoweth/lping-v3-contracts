import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { Contract, constants } from "ethers";

import { EULER_CONTRACTS, UNISWAP_V3_CONTRACTS, WETH_ADDRESS } from "../constants/addresses";
import { Action, AdapterId, AdapterType } from "../constants/enums";

import {
	Client,
	DexAggregator,
	EulerAdapter,
	Factory,
	IModuleManager__factory,
	LendingDispatcher,
	ModuleManager,
	NFTForwarder,
	Registry,
	V2Swap,
	V3Swap
} from "../../../typechain-types";


interface CompleteFixture {
	deployer: SignerWithAddress
	traders: SignerWithAddress[]
	registry: Registry
	factory: Factory
	moduleManager: ModuleManager
	implementation: Client
	clients: Client[]
	modules: {
		dexAggregator: DexAggregator
		lendingDispatcher: LendingDispatcher
		nftForwarder: NFTForwarder
	}
	adapters: {
		v3Swap: V3Swap
		v2Swap: V2Swap
		eulerAdapter: EulerAdapter
	}
}

export const completeFixture = async () => {
	const { deployer, traders } = await getSigners()

	const registry = await deployContract<Registry>("Registry", deployer, [WETH_ADDRESS])

	const factory = await deployContract<Factory>("Factory", deployer, [])

	const moduleManager = await deployContract<ModuleManager>("ModuleManager", deployer, [])

	await Promise.all([
		factory.setRegistry(registry.address),
		registry.setFactory(factory.address),
		registry.setModuleManager(moduleManager.address),
	])

	const {
		dexAggregator,
		lendingDispatcher,
		nftForwarder
	} = await deployModules(deployer, registry, factory)

	const { eulerAdapter, v2Swap, v3Swap } = await deployAdapters(deployer, registry)

	const { clients, implementation } = await deployClients(deployer, traders, registry, factory)

	const fixture: CompleteFixture = {
		deployer,
		traders,
		registry,
		factory,
		moduleManager,
		implementation,
		clients,
		modules: {
			dexAggregator,
			lendingDispatcher,
			nftForwarder,
		},
		adapters: {
			eulerAdapter,
			v2Swap,
			v3Swap
		},
	}

	return fixture
}

export const deployClients = async (
	deployer: SignerWithAddress,
	traders: SignerWithAddress[],
	registry: Registry,
	factory: Factory
) => {
	const implementation = await deployContract<Client>("Client", deployer, [
		await registry.moduleManager(),
		UNISWAP_V3_CONTRACTS.NFT,
		WETH_ADDRESS
	])

	await factory.setImplementation(implementation.address)

	const clients = await Promise.all(
		traders.map(async (trader) => {
			await factory.connect(trader).deploy()

			const clientAddress = await factory.computeAddress(trader.address, 0)
			const client = implementation.attach(clientAddress)

			const modules = await factory.getModules([])
			await IModuleManager__factory.connect(client.address, trader).update(Action.ADD, modules)

			return client
		})
	)

	return { implementation, clients }
}

const deployModules = async (deployer: SignerWithAddress, registry: Registry, factory: Factory) => {
	const nftForwarder = await deployContract<NFTForwarder>("NFTForwarder", deployer, [
		UNISWAP_V3_CONTRACTS.FACTORY,
		UNISWAP_V3_CONTRACTS.NFT,
	])

	const dexAggregator = await deployContract<DexAggregator>("DexAggregator", deployer, [registry.address])

	const lendingDispatcher = await deployContract<LendingDispatcher>("LendingDispatcher", deployer, [registry.address])

	await Promise.all([
		factory.setModule(constants.MaxUint256, nftForwarder.address, await getSelectors(nftForwarder)),
		factory.setModule(constants.MaxUint256, dexAggregator.address, await getSelectors(dexAggregator)),
		factory.setModule(constants.MaxUint256, lendingDispatcher.address, await getSelectors(lendingDispatcher)),
	])

	return { dexAggregator, lendingDispatcher, nftForwarder }
}

const deployAdapters = async (deployer: SignerWithAddress, registry: Registry) => {
	const v3Swap = await deployContract<V3Swap>("V3Swap", deployer, [
		UNISWAP_V3_CONTRACTS.FACTORY,
		WETH_ADDRESS,
		AdapterId.V3_SWAP
	])

	const v2Swap = await deployContract<V2Swap>("V2Swap", deployer, [
		WETH_ADDRESS,
		AdapterId.V2_SWAP
	])

	const eulerAdapter = await deployContract<EulerAdapter>("EulerAdapter", deployer, [
		EULER_CONTRACTS.EULER,
		EULER_CONTRACTS.MARKETS,
		EULER_CONTRACTS.SIMPLE_LENS,
		WETH_ADDRESS,
		AdapterId.EULER_ADAPTER
	])

	await Promise.all([
		registry.setAdapter(0, v3Swap.address, AdapterType.SWAP),
		registry.setAdapter(0, v2Swap.address, AdapterType.SWAP),
		registry.setAdapter(0, eulerAdapter.address, AdapterType.LEND),
	])

	return { v3Swap, v2Swap, eulerAdapter }
}

export const deployContract = async <T>(name: string, deployer: SignerWithAddress, args?: any[]) => {
	const contractFactory = await ethers.getContractFactory(name, deployer)
	const contract = args ? await contractFactory.deploy(...args) : await contractFactory.deploy()
	await contract.deployed()

	return contract as T
}

export const getSelectors = async (contract: Contract, excludes: string[] = []) => {
	const excludedSigs = ["id"].concat(excludes).reduce<string[]>((acc, signature) => {
		try {
			const func = contract.interface.getFunction(signature).format()

			if (!!func) {
				acc.push(func)
			}
		} catch (error) { }

		return acc
	}, [])
	const signatures = Object.keys(contract.interface.functions)
	const selectors = signatures.reduce((acc: string[], sig: string) =>
		!excludedSigs.includes(sig) ? acc.concat(contract.interface.getSighash(sig)) : acc, []
	)

	return selectors
}

export const getSigners = async () => {
	const [deployer, ...signers] = await ethers.getSigners()
	const traders = signers.slice(0, 4)

	return { deployer, traders }
}

import { HardhatRuntimeEnvironment } from "hardhat/types";


declare var hre: HardhatRuntimeEnvironment

const DEFAULT_TRACER_CONFIG: TracerConfig = {
	logs: true,
	calls: true,
	sstores: false,
	sloads: false,
	gasCost: true,
}

interface TestEnvConfig {
	title: string
	tracer?: {
		enabled: boolean
		config?: TracerConfig
	}
	skipOptional?: boolean
}

interface TracerConfig {
	logs: boolean
	calls: boolean
	sstores: boolean
	sloads: boolean
	gasCost: boolean
}

interface Spec {
	desc: string
	action(env: TestEnv): Promise<void>
	optional?: boolean
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))


export class TestEnv {
	public readonly title: string
	public readonly tests: Spec[]
	public readonly skipOptional: boolean

	constructor(config: TestEnvConfig) {
		this.title = config.title
		this.tests = []
		this.skipOptional = config.skipOptional === true

		if (!!config.tracer && config.tracer.enabled === true) {
			const {
				logs,
				calls,
				sstores,
				sloads,
				gasCost
			} = config.tracer.config || DEFAULT_TRACER_CONFIG

			hre.tracer.enabled = true
			hre.tracer.logs = logs
			hre.tracer.calls = calls
			hre.tracer.sstores = sstores
			hre.tracer.sloads = sloads
			hre.tracer.gasCost = gasCost
		} else {
			hre.tracer.enabled = false
		}
	}

	public set(spec: Spec): this {
		this.tests.push(spec)
		return this
	}

	public run() {
		describe(this.title, () => {
			for (const spec of this.tests) {
				if (!!this.skipOptional && spec.optional === true) continue

				it(spec.desc, async () => {
					await spec.action(this)
					await sleep(2000)
				})
			}
		})
	}
}

export const initTestEnv = (config: TestEnvConfig) => {
	return new TestEnv(config)
}

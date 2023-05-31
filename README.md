# LPing-V3

This project is built to automate the process of lping on Uniswap V3 pools based on the flowchart below created by <a href="https://twitter.com/guil_lambert">@guil_lambert</a>. You can find his original tweet from <a href="https://twitter.com/guil_lambert/status/1484186937736970240">here</a>.

### Flowchart

![alt text](https://pbs.twimg.com/media/FJjglWvVUAYime0?format=jpg&name=360x360)

## Installation

```bash
git clone https://github.com/fomoweth/lping-v3-contracts

cd lping-v3-contracts

npm install
```

## Usage

Create an environment file `.env` with the following content:

```text
MNEMONIC=YOUR_MNEMONIC (Optional)
ALCHEMY_API_KEY=YOUR_ALCHEMY_API_KEY
INFURA_API_KEY=YOUR_INFURA_API_KEY
CMC_API_KEY=YOUR_COIN_MARKET_CAP_API_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
FORK_BLOCK_NUMBER=16194620
ENABLE_GAS_REPORT=true || false
```

Then you can compile the contracts:

```bash
# compile contracts to generate artifacts and typechain-types
npm run compile

# remove the generated artifacts and typechain-types
npm run clean

# clean and compile
npm run build
```

## Test

```bash
# to run hardhat test
npm test

# you can test specific files by selecting the path
npm test ./test/Client.ts
```

## Contracts

### Core

**Client** - Contract that can be deployed by anyone permissionlessly and is used as the interface of `module` contracts to manage position.

**Factory** - Contract that is used for deploying the `Client` contracts and registering the `module` contracts by its owner.

**Registry** - Contract that stores the addresses of `Factory` and `Adapter` contracts.

### Modules

**ModuleManager** - Contract that is used for updating the states of `module` contracts for the `Client`.

**NFTForwarder** - Contract that is used for forwarding the transactions to `NonfungiblePositionManager` for the `Client`.

**DexAggregator** - Contract that is used for aggregating between different types of DEX pools. (`Uniswap V3 Pools` and `Uniswap V2 Pairs`)

**LendingDispatcher** - Contract that is used for aggregating between the lending protocols. (`Euler Finance`)

### Adapters

**V3Swap** - Contract that is used for forwarding the transactions to the `Uniswap V3 Pools` via `DexAggregator`.

**V2Swap** - Contract that is used for forwarding the transactions to the `Uniswap V2 Pairs` via `DexAggregator`.

**EulerAdapter** - Contract that is used for forwarding the transactions to the contracts of `Euler Finance` via `LendingDispatcher`.

<a href="https://www.rkim.xyz/posts/lping-v3">Read more</a>

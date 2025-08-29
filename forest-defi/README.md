# Forest DeFi on Monad

**Forest DeFi** is a comprehensive staking and yield farming platform built on Monad blockchain, featuring:

- **ForestStakingManager**: Core staking contract with adapter architecture
- **fMON Token**: Staking rewards token (ERC20)
- **AdapterMock**: Test adapter for development and testing
- **Automated Harvesting**: Keeper scripts for periodic reward collection
- **Comprehensive Testing**: Foundry-based unit tests

## Quick Start

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js (for wallet integration)

### Build & Test

```bash
# Build contracts
forge build

# Run tests
forge test -vvvv

# Run specific test
forge test --match-test testDepositWithdraw -vvvv
```

### Deploy

```bash
# Set environment variables
export MONAD_RPC=https://testnet-rpc.monad.xyz
export PRIVATE_KEY=0xYourPrivateKey
export OWNER=0xYourOwnerAddress
export FEE_RECIPIENT=0xYourTreasuryAddress

# Deploy all contracts
forge script script/DeployAll.s.sol --rpc-url $MONAD_RPC --broadcast
```

### Harvest (Keeper)

```bash
# Manual harvest
export MANAGER=0xYourManagerAddress
forge script script/Harvest.s.sol --rpc-url $MONAD_RPC --broadcast --private-key $PRIVATE_KEY
```

## Architecture

### Core Contracts

**ForestStakingManager.sol**
- Manages MON token staking and fMON rewards
- Adapter-based architecture for flexible staking strategies
- Fee collection and treasury management
- Harvest functionality for reward distribution

**fMON.sol**
- ERC20 token representing staking shares
- Minted/burned based on staking activity
- Used for reward distribution and governance

**AdapterMock.sol**
- Test adapter for development
- Simulates reward generation
- Configurable reward rates

### Testing

Comprehensive test suite covering:
- Deposit/withdraw functionality
- Harvest with fee minting
- Pro-rata share calculations
- Reward distribution

```bash
# Run all tests
forge test -vvvv

# Run specific test categories
forge test --match-contract ForestStakingManagerTest -vvvv
```

## GitHub Actions

### CI (build & tests)
- On every push/PR to `main`, CI will install Foundry, build, and run tests.

### Harvest workflow
1. Add repo **Secrets** (`Settings → Secrets and variables → Actions → New repository secret`):
   - `MONAD_RPC` = https://testnet-rpc.monad.xyz
   - `PRIVATE_KEY` = deployer/keeper private key (testnet only)
   - `MANAGER` = your deployed ForestStakingManager address (optional if provided at dispatch)
2. Run manually: **Actions → Harvest → Run workflow** (optionally fill manager addr input).
3. (Optional) Enable the cron in `harvest.yml` to run every 6h.

> ⚠️ Never commit real mainnet keys. Use a dedicated testnet key for Actions.

## Makefile Commands

```bash
make build    # Build contracts
make deploy   # Deploy to testnet
make harvest  # Run harvest script
make test     # Run tests
make clean    # Clean build artifacts
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# RPC + accounts
MONAD_RPC=https://testnet-rpc.monad.xyz
OWNER=0xYourOwnerAddress
FEE_RECIPIENT=0xYourTreasuryAddress
# For scripts that need signing (local only; DO NOT commit real keys)
PRIVATE_KEY=0xYourDeployerPrivateKey
# After deploy, set your manager addr here for convenience
MANAGER=0xYourManagerAddress
```

## Documentation

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Monad Documentation](https://docs.monad.xyz/)

# @arbitrum/agentic-wallets

A TypeScript SDK + CLI that enables AI agents to have smart contract wallets on Arbitrum using account abstraction (ERC-4337).

## Features

- **Smart Account Creation** - Create ERC-4337 smart contract wallets for AI agents
- **Key Management** - Secure generation, AES-256-GCM encryption, and storage of agent private keys
- **Session Keys** - Scoped, time-limited session keys so agents operate with minimal permissions
- **Transaction Execution** - Send UserOperations through bundlers with optional gas sponsorship
- **Provider Agnostic** - Supports Alchemy and ZeroDev as bundler/paymaster providers
- **Multi-chain** - Arbitrum One and Arbitrum Sepolia
- **CLI** - Full-featured command-line interface wrapping the SDK

## Quick Start

### Installation

```bash
npm install @arbitrum/agentic-wallets
```

For the CLI:

```bash
npm install -g @arbitrum/agentic-wallets-cli
```

### SDK Usage

```typescript
import { AgenticWallet } from '@arbitrum/agentic-wallets';

// Create and initialize wallet
const wallet = new AgenticWallet();
await wallet.initialize({
  network: 'arbitrum-one',
  provider: 'alchemy',
  apiKey: process.env.ALCHEMY_API_KEY!,
});

// Create a new agent wallet
const info = await wallet.createWallet('strong-encryption-password');
console.log(`Smart account: ${info.address}`);
console.log(`Owner EOA: ${info.ownerAddress}`);

// Check balance
const balance = await wallet.getBalance(info.address);
console.log(`Balance: ${balance.formatted} ${balance.symbol}`);

// Send a transaction
const result = await wallet.sendTransaction(
  info.ownerAddress.toLowerCase(),
  'strong-encryption-password',
  {
    calls: [{ to: '0x...', value: 1000000000000000n }],
    sponsorGas: true,
  },
);
console.log(`UserOp hash: ${result.userOpHash}`);
```

### CLI Usage

```bash
# Set required environment variables
export ARBITRUM_WALLET_API_KEY=your-provider-api-key
export ARBITRUM_WALLET_PASSWORD=your-encryption-password

# Create a wallet
arbitrum-wallet create --network arbitrum-sepolia --provider alchemy

# Check balance
arbitrum-wallet balance 0xYourAddress --network arbitrum-sepolia

# Send a transaction
arbitrum-wallet send \
  --wallet 0xOwnerAddress \
  --to 0xRecipient \
  --value 0.01 \
  --network arbitrum-sepolia

# Manage session keys
arbitrum-wallet session create \
  --wallet 0xWalletAddress \
  --label "trading-bot" \
  --duration 3600

arbitrum-wallet session list --wallet 0xWalletAddress
arbitrum-wallet session revoke --wallet 0xWalletAddress --session <session-id>
```

## Architecture

This project uses an **SDK-first** architecture:

- **`@arbitrum/agentic-wallets`** - Core SDK library with wallet, key management, session keys, and provider adapters
- **`@arbitrum/agentic-wallets-cli`** - Thin CLI wrapper using Commander.js

The SDK is provider-agnostic through the `BundlerProvider` interface, allowing any ERC-4337 bundler/paymaster service to be plugged in.

See [Architecture Decision Document](./docs/architecture.md) for details on ERC-4337 vs ERC-7702 choices.

## Project Structure

```
├── packages/
│   ├── sdk/                 # Core SDK (@arbitrum/agentic-wallets)
│   │   └── src/
│   │       ├── core/        # Wallet, KeyManager, SessionManager
│   │       ├── providers/   # Alchemy, ZeroDev adapters
│   │       ├── types/       # TypeScript interfaces and types
│   │       └── utils/       # Crypto, storage, validation
│   └── cli/                 # CLI (@arbitrum/agentic-wallets-cli)
│       └── src/
│           └── commands/    # create, import, send, balance, info, session
├── docs/                    # Documentation
├── examples/                # Usage examples
├── turbo.json               # Turborepo configuration
└── package.json             # Monorepo root
```

## Documentation

- [Architecture & Design Decisions](./docs/architecture.md)
- [SDK API Reference](./docs/api-reference.md)
- [CLI Reference](./docs/cli-reference.md)

## Examples

- [Basic Agent Wallet](./examples/basic-wallet.ts) - Create, fund, and use a wallet
- [Session Key Management](./examples/session-keys.ts) - Create and manage scoped session keys
- [Gas-Sponsored Transactions](./examples/gas-sponsored.ts) - Send transactions with paymaster sponsorship

## Development

### Prerequisites

- Node.js >= 20.0.0
- npm >= 11.8.0

### Setup

```bash
git clone https://github.com/xdaniortega/test1.git
cd test1
npm install
npm run build
```

### Commands

```bash
npm run build          # Build all packages
npm run test           # Run all tests
npm run lint           # Lint all packages
npm run format         # Format code with Prettier
npm run format:check   # Check formatting
npm run clean          # Clean build artifacts
```

### Running Tests

```bash
# All tests
npm run test

# SDK tests only
cd packages/sdk && npm test

# Watch mode
cd packages/sdk && npm run test:watch
```

## Supported Networks

| Network          | Chain ID | Type    |
| ---------------- | -------- | ------- |
| Arbitrum One     | 42161    | Mainnet |
| Arbitrum Sepolia | 421614   | Testnet |

## Supported Providers

| Provider | Bundler | Paymaster | Session Keys |
| -------- | ------- | --------- | ------------ |
| Alchemy  | Yes     | Yes       | Planned      |
| ZeroDev  | Yes     | Yes       | Planned      |

## License

MIT

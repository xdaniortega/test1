# Arbitrum Agent Kit

Secure wallet infrastructure for AI agents on Arbitrum. Give your agents smart contract wallets with scoped permissions, encrypted key management, and gasless transactions.

**Built for Arbitrum. Not a fork. Not a wrapper.**

## Why This Exists

AI agents need wallets. But giving an agent an unscoped private key is a security disaster. Agents need:

- **Least-privilege access** — session keys that expire, that can only call specific contracts, that have spending caps
- **Encrypted key storage** — private keys encrypted at rest with AES-256-GCM, never stored in plaintext
- **Gasless execution** — agents shouldn't need pre-funded ETH to operate; paymasters cover gas
- **Vendor independence** — switch between Alchemy, ZeroDev, or Ambire without changing your code

This SDK solves all of that with a clean TypeScript API and a CLI for quick operations.

## Install

```bash
npm install @arbitrum/agentic-wallets
```

## 30-Second Example

```typescript
import { AgenticWallet } from '@arbitrum/agentic-wallets';

const wallet = new AgenticWallet();
await wallet.initialize({
  network: 'arbitrum-one',
  provider: 'alchemy', // or 'zerodev' or 'ambire'
  apiKey: process.env.PROVIDER_API_KEY!,
});

// Create an agent wallet — key is generated and encrypted automatically
const agent = await wallet.createWallet('encryption-password');
console.log(agent.address); // Smart account address
console.log(agent.ownerAddress); // Owner EOA

// Create a session key — 1 hour, max 0.1 ETH per tx, restricted to one contract
const session = await wallet.createSessionKey(
  agent.address,
  {
    label: 'trading-bot',
    validAfter: Math.floor(Date.now() / 1000),
    validUntil: Math.floor(Date.now() / 1000) + 3600,
    permissions: {
      allowedTargets: ['0xYourDexRouter...'],
      maxValuePerTransaction: 100000000000000000n, // 0.1 ETH
    },
  },
  'encryption-password',
);

// Send a gasless transaction
const result = await wallet.sendTransaction(
  agent.ownerAddress.toLowerCase(),
  'encryption-password',
  {
    calls: [{ to: '0xRecipient', value: 1000000000000000n }],
    sponsorGas: true,
  },
);
```

## What You Can Do

### SDK (`@arbitrum/agentic-wallets`)

| Feature                | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| **Create wallets**     | Generate ERC-4337 smart account wallets for agents      |
| **Import keys**        | Bring an existing private key, get a smart account      |
| **Session keys**       | Time-limited, contract-scoped, value-capped permissions |
| **Send transactions**  | UserOperations through bundlers, with batching support  |
| **Sponsor gas**        | Paymaster integration for gasless agent operations      |
| **Check balances**     | Query native ETH balance on any address                 |
| **Encrypt everything** | AES-256-GCM encryption with scrypt key derivation       |

### CLI (`arbitrum-wallet`)

```bash
export ARBITRUM_WALLET_API_KEY=your-key
export ARBITRUM_WALLET_PASSWORD=your-password

arbitrum-wallet create --network arbitrum-sepolia --provider ambire
arbitrum-wallet balance 0xAddress
arbitrum-wallet send --wallet 0xOwner --to 0xRecipient --value 0.01 --sponsor-gas
arbitrum-wallet session create --wallet 0xAddr --label "my-bot" --duration 3600
arbitrum-wallet session list --wallet 0xAddr
arbitrum-wallet session revoke --wallet 0xAddr --session <id>
arbitrum-wallet info 0xOwner
arbitrum-wallet import 0xPrivateKey
```

Every command supports `--dry-run` to simulate without executing.

## Providers

The SDK is provider-agnostic. You pick the bundler/paymaster backend; the code stays the same.

| Provider    | Type                | Gas Sponsorship        | What It Does                                                                   |
| ----------- | ------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| **Alchemy** | Bundler + Paymaster | Gas Manager policies   | Industry-standard ERC-4337 infrastructure                                      |
| **ZeroDev** | Bundler + Paymaster | Paymaster policies     | Kernel v3 smart accounts with modular plugins                                  |
| **Ambire**  | Relayer + Gas Tank  | Gas Tank (multi-token) | Hybrid AA — combines ERC-4337 + ERC-7702, supports ~100 tokens for gas payment |

### Adding Ambire

Ambire is the first wallet to implement EIP-7702 (Pectra upgrade). Their hybrid approach means:

- **ERC-4337 smart accounts** for new agent wallets with full programmability
- **ERC-7702 EOA delegation** for agents that need to use existing addresses
- **Gas Tank** — pre-pay gas in USDC, DAI, or ~100 other tokens across chains
- **Relayer** — handles broadcasting, nonce management, and MEV protection

```typescript
await wallet.initialize({
  network: 'arbitrum-one',
  provider: 'ambire',
  apiKey: process.env.AMBIRE_API_KEY!,
});
```

### Implementing Your Own Provider

Implement the `BundlerProvider` interface:

```typescript
import { type BundlerProvider } from '@arbitrum/agentic-wallets';

class MyProvider implements BundlerProvider {
  readonly name = 'my-provider';
  async initialize(chain, apiKey) {
    /* ... */
  }
  async createSmartAccount(ownerKey, salt?) {
    /* ... */
  }
  async getSmartAccountAddress(ownerKey, salt?) {
    /* ... */
  }
  async isAccountDeployed(address) {
    /* ... */
  }
  async sendUserOperation(ownerKey, calls, options?) {
    /* ... */
  }
  async estimateUserOperationGas(ownerKey, calls) {
    /* ... */
  }
  async waitForUserOperationReceipt(hash) {
    /* ... */
  }
  async getBalance(address) {
    /* ... */
  }
}
```

## Session Keys — The Core Differentiator

Session keys are what make agent wallets safe. Instead of giving an agent the master key, you create scoped credentials:

```typescript
const session = await wallet.createSessionKey(
  walletAddress,
  {
    label: 'defi-bot',
    validAfter: now,
    validUntil: now + 86400, // 24 hours
    permissions: {
      allowedTargets: ['0xRouter'], // Can only call this contract
      maxValuePerTransaction: 0n, // Cannot send ETH (read-only calls)
      maxTransactions: 1000, // Max 1000 operations
    },
  },
  password,
);
```

**What you control:**

| Permission               | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| `allowedTargets`         | Whitelist of contract addresses the session key can interact with |
| `allowedFunctions`       | Whitelist of function selectors per contract                      |
| `maxValuePerTransaction` | Cap on ETH per call (set to `0n` for read-only)                   |
| `maxTotalValue`          | Cumulative ETH spending limit                                     |
| `maxTransactions`        | Total number of operations allowed                                |
| Time window              | `validAfter` / `validUntil` (unix timestamps)                     |

Session keys are encrypted with the same AES-256-GCM scheme as wallet keys. Revocation is instant.

## Architecture

```
@arbitrum/agentic-wallets (SDK)
├── AgenticWallet          ← Main entry point
│   ├── KeyManager         ← Key generation, AES-256-GCM encryption, address derivation
│   ├── SessionManager     ← Session key lifecycle (create, list, revoke)
│   └── BundlerProvider    ← Abstract interface for bundler/paymaster backends
│       ├── AlchemyProvider
│       ├── ZeroDevProvider
│       └── AmbireProvider

@arbitrum/agentic-wallets-cli (CLI)
└── commander.js wrapper   ← Thin layer over the SDK
```

The SDK is the product. The CLI is a convenience wrapper. Everything the CLI does, the SDK does programmatically.

## Project Structure

```
├── packages/
│   ├── sdk/                    # @arbitrum/agentic-wallets
│   │   └── src/
│   │       ├── core/           # AgenticWallet, KeyManager, SessionManager
│   │       ├── providers/      # Alchemy, ZeroDev, Ambire adapters
│   │       ├── types/          # TypeScript interfaces, chain config, errors
│   │       └── utils/          # AES-256-GCM crypto, file storage, validators
│   └── cli/                    # @arbitrum/agentic-wallets-cli
│       └── src/commands/       # create, import, send, balance, info, session
├── docs/
│   ├── architecture.md         # ERC-4337 vs ERC-7702, provider design, security model
│   ├── api-reference.md        # Every class, method, type, and error
│   └── cli-reference.md        # Every command with examples
├── examples/
│   ├── basic-wallet.ts         # Create wallet, check balance, send tx
│   ├── session-keys.ts         # Session key lifecycle
│   └── gas-sponsored.ts        # Gasless + batched transactions
└── .github/workflows/ci.yml   # CI: build, test, lint on Node 20/22
```

## Networks

| Network          | Chain ID | Status     |
| ---------------- | -------- | ---------- |
| Arbitrum One     | 42161    | Production |
| Arbitrum Sepolia | 421614   | Testnet    |

## Development

```bash
git clone https://github.com/xdaniortega/test1.git && cd test1
npm install
npm run build       # Build SDK + CLI
npm run test        # 44 unit tests
npm run lint        # ESLint (strict TypeScript)
npm run format      # Prettier
```

## Documentation

| Document                                 | What's in it                                                                      |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| [Architecture](./docs/architecture.md)   | ERC-4337 vs ERC-7702 decisions, provider design, security model, Ambire hybrid AA |
| [API Reference](./docs/api-reference.md) | Every class, method, type, and error in the SDK                                   |
| [CLI Reference](./docs/cli-reference.md) | Every command, flag, and output format                                            |

## How This Differs from Base AgentKit

|                  | Arbitrum Agent Kit                        | Base AgentKit                            |
| ---------------- | ----------------------------------------- | ---------------------------------------- |
| **Chain**        | Arbitrum One / Sepolia                    | Base (Coinbase L2)                       |
| **Approach**     | SDK-first library                         | Framework-coupled (LangChain, Vercel AI) |
| **Session keys** | First-class, deeply integrated            | Not a core feature                       |
| **Providers**    | Alchemy, ZeroDev, Ambire                  | CDP wallets (Coinbase)                   |
| **Key storage**  | Local encrypted (AES-256-GCM)             | Cloud-managed (CDP API)                  |
| **ERC-7702**     | Ambire integration (hybrid AA)            | Not supported                            |
| **Dependencies** | viem + permissionless (minimal)           | CDP SDK, LangChain, etc.                 |
| **Philosophy**   | You own your keys, you pick your provider | Coinbase manages infrastructure          |

This is not a fork or wrapper of any existing kit. It's built from scratch for Arbitrum's ecosystem.

## License

MIT

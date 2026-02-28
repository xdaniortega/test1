# Architecture

## The Problem

AI agents need on-chain wallets. But traditional key management is dangerous for agents:

- An agent with an unscoped private key can drain the entire wallet
- There's no way to limit what contracts an agent can call, how much it can spend, or when it can operate
- Agents running autonomously need gasless execution — they can't stop to get ETH for gas
- Vendor lock-in to a single infrastructure provider is risky

This SDK solves these problems with account abstraction, session keys, and a provider-agnostic architecture.

## Account Abstraction: ERC-4337 vs ERC-7702

### ERC-4337 — Smart Contract Wallets (Primary)

ERC-4337 is the primary standard used by this SDK. Here's why:

**How it works:**

1. Agent wallets are smart contracts (not EOAs)
2. Transactions are packed as `UserOperations` and sent to a bundler
3. The bundler submits them to the EntryPoint contract on-chain
4. Paymasters can sponsor gas, so the agent wallet doesn't need ETH
5. Smart accounts support batching — multiple calls in one atomic transaction

**Why we chose it for agents:**

- **New accounts** — Agents need fresh wallets, not delegation from existing EOAs. ERC-4337's counterfactual deployment (address known before deployment) is perfect for this.
- **Session keys** — Smart account validation modules enable scoped, time-limited, revocable session keys. This is the core security primitive for agent wallets.
- **Gas sponsorship** — Paymasters are native to ERC-4337. Agents can operate without pre-funded ETH.
- **Batching** — Execute approve + swap in a single UserOperation. Critical for DeFi agent workflows.
- **Mature ecosystem** — Alchemy, ZeroDev, Pimlico, Biconomy all support it in production.

### ERC-7702 — EOA Code Delegation (Via Ambire)

ERC-7702 was introduced with Ethereum's Pectra upgrade (May 2025). It allows an EOA to temporarily delegate its execution to a smart contract.

**How it works:**

1. An EOA sets a "delegation designator" pointing to a smart contract
2. For that transaction, the EOA behaves like a smart account
3. After the transaction, the EOA can revert to normal behavior
4. No separate account deployment needed

**Where it fits:**

- Agents that need to use an **existing EOA address** (e.g., an address that already holds tokens)
- Lower gas costs than deploying a new smart account
- Ambire's hybrid AA approach combines ERC-4337 + ERC-7702 in a single wallet

**Why it's not the primary standard:**

- Newer, less battle-tested tooling
- The "root" EOA key cannot be revoked under ERC-7702 — session key management is more limited
- Agent wallets are typically fresh accounts, not existing EOAs

The SDK is designed so that ERC-7702 support via Ambire's hybrid model is available today, and deeper native ERC-7702 support can be added without breaking changes.

## Provider Architecture

### The BundlerProvider Interface

Every bundler/paymaster provider implements one interface:

```typescript
interface BundlerProvider {
  readonly name: string;

  initialize(chain: Chain, apiKey: string): Promise<void>;

  // Account management
  createSmartAccount(ownerPrivateKey: Hex, salt?: bigint): Promise<Address>;
  getSmartAccountAddress(ownerPrivateKey: Hex, salt?: bigint): Promise<Address>;
  isAccountDeployed(address: Address): Promise<boolean>;

  // Transaction execution
  sendUserOperation(
    ownerPrivateKey: Hex,
    calls: TransactionRequest[],
    options?: { sponsorGas?: boolean },
  ): Promise<TransactionResult>;
  estimateUserOperationGas(ownerPrivateKey: Hex, calls: TransactionRequest[]): Promise<GasEstimate>;
  waitForUserOperationReceipt(userOpHash: Hash): Promise<UserOperationReceipt>;

  // Read operations
  getBalance(address: Address): Promise<bigint>;
}
```

### Why This Design

**Vendor independence.** Changing providers is a one-line config change:

```typescript
// Switch from Alchemy to Ambire — zero code changes
await wallet.initialize({
  provider: 'ambire', // was 'alchemy'
  ...
});
```

**Testability.** Mock the interface in tests without network calls:

```typescript
const mockProvider: BundlerProvider = {
  name: 'mock',
  sendUserOperation: async () => ({ userOpHash: '0x...', success: true }),
  // ...
};
```

**Extensibility.** Adding a new provider (Pimlico, Biconomy, etc.) means implementing one interface. No changes to the SDK core.

### Implemented Providers

| Provider    | Smart Account  | Bundler                        | Gas Sponsorship                 |
| ----------- | -------------- | ------------------------------ | ------------------------------- |
| **Alchemy** | Simple Account | `arb-mainnet.g.alchemy.com`    | Gas Manager policies            |
| **ZeroDev** | Kernel v3      | `rpc.zerodev.app`              | Paymaster policies              |
| **Ambire**  | AmbireAccount  | Relayer (`relayer.ambire.com`) | Gas Tank (~100 tokens accepted) |

### Ambire's Hybrid Model

Ambire is unique because it was the first wallet to implement both ERC-4337 and ERC-7702. Their architecture:

```
Agent Key → AmbireAccount (smart contract)
         ↓
         Ambire Relayer → Arbitrum
         ↑
         Gas Tank (pay gas in USDC, DAI, etc.)
```

Key differences from other providers:

- **Gas Tank** — Instead of a per-transaction paymaster, Ambire uses a pre-paid gas pool. Deposit USDC once, pay gas across chains. Supports ~100 tokens.
- **Relayer** — A backend service that handles broadcasting, nonce management, and MEV protection via Flashbots.
- **Hybrid accounts** — Same address can operate as both EOA (ERC-7702) and smart account (ERC-4337), allowing gradual migration.
- **Account recovery** — Built-in recovery mechanism with configurable timelocks and multiple signer keys.

## Security Model

### Key Encryption

Private keys are never stored in plaintext. The encryption scheme:

| Parameter      | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| Algorithm      | AES-256-GCM (authenticated encryption with associated data) |
| Key derivation | scrypt (N=16384, r=8, p=1, dkLen=32)                        |
| IV             | 16 bytes, randomly generated per encryption                 |
| Salt           | 32 bytes, randomly generated per encryption                 |
| Auth tag       | 16 bytes, prevents ciphertext tampering                     |

**Why AES-256-GCM:** Authenticated encryption ensures both confidentiality and integrity. If anyone tampers with the ciphertext, decryption fails with an authentication error rather than producing garbage output.

**Why scrypt:** Memory-hard KDF that makes brute-force password attacks expensive. The parameters (N=16384) provide a good balance between security and responsiveness.

### File Storage

Encrypted keys are stored with restrictive permissions:

```
~/.arbitrum-wallets/
├── wallets/
│   └── {owner-address}.json       # mode 0o600 (owner read/write only)
└── sessions/
    └── {wallet-address}/
        └── {session-id}.json       # mode 0o600
```

Directories are created with mode `0o700` (owner access only).

### Session Key Security

Session keys implement the principle of least privilege:

1. **Time-bounded** — Every session has a `validAfter` and `validUntil` timestamp. Expired sessions cannot be used.
2. **Contract-scoped** — `allowedTargets` restricts which contracts the session key can call. An agent trading on Uniswap can't suddenly call an arbitrary contract.
3. **Value-capped** — `maxValuePerTransaction` and `maxTotalValue` prevent an agent from draining the wallet.
4. **Operation-limited** — `maxTransactions` caps total operations.
5. **Instant revocation** — `revokeSession()` immediately invalidates a session key.
6. **Separate keys** — Each session generates its own private key, encrypted independently. Compromising a session key doesn't compromise the wallet.

### Threat Model

| Threat               | Mitigation                                               |
| -------------------- | -------------------------------------------------------- |
| Agent key compromise | Session keys limit blast radius (time, value, contracts) |
| Storage breach       | Keys encrypted with AES-256-GCM; attacker needs password |
| Rogue agent behavior | Spending caps and contract allowlists                    |
| Password brute-force | scrypt KDF makes each attempt expensive                  |
| Ciphertext tampering | GCM auth tag detects modification                        |
| Session key leak     | Time-limited, immediately revocable, value-capped        |

## Technology Stack

| Component        | Choice           | Rationale                              |
| ---------------- | ---------------- | -------------------------------------- |
| Ethereum library | viem             | Type-safe, tree-shakeable, modern      |
| AA primitives    | permissionless   | Lightweight ERC-4337 utilities         |
| Build            | TypeScript + tsc | Strict mode, declaration maps          |
| Testing          | Vitest           | Fast, ESM-native, compatible with viem |
| Monorepo         | Turborepo        | Task orchestration, build caching      |
| CLI framework    | Commander.js     | Mature, well-documented                |
| Linting          | ESLint 9         | TypeScript-aware rules, flat config    |
| Formatting       | Prettier         | Consistent code style                  |

## Roadmap

1. **On-chain session key validation** — Deploy session key validator modules on Arbitrum that enforce permissions at the smart contract level, not just locally
2. **ERC-7702 native mode** — Direct EOA delegation support without the Ambire relayer
3. **Multi-sig for high-value operations** — Require multiple signers for policy changes and large transfers
4. **Hardware wallet support** — Ledger/Trezor as the owner key for maximum security
5. **Event monitoring** — WebSocket subscriptions for real-time wallet activity tracking
6. **Action providers** — Composable DeFi actions (swap, lend, bridge) built on top of the wallet SDK

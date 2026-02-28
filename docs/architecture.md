# Architecture Decision Document

## Overview

This document explains the architectural decisions behind `@arbitrum/agentic-wallets`, focusing on the choice of account abstraction standards, provider design, and security model.

## ERC-4337 vs ERC-7702

### ERC-4337: Account Abstraction via UserOperations

ERC-4337 introduces smart contract wallets (smart accounts) that are controlled by an EntryPoint contract. Transactions are sent as `UserOperations` through a separate mempool, processed by bundlers, and optionally sponsored by paymasters.

**Key properties:**

- Smart accounts are contracts deployed on-chain
- Transactions go through bundlers, not directly to the network
- Gas can be sponsored by paymasters (gasless transactions for users)
- Native support for batched transactions
- Session keys and permission scoping via validation modules
- Counterfactual addresses: the account address is known before deployment

### ERC-7702: Set EOA Code

ERC-7702 allows an EOA (Externally Owned Account) to temporarily delegate its execution to a smart contract by setting code on the EOA address. This is a protocol-level change introduced in the Pectra upgrade.

**Key properties:**

- Works with existing EOAs (no new account creation needed)
- Temporary code delegation per transaction
- Lower gas costs (no separate account deployment)
- Compatible with ERC-4337 validation logic
- Requires Pectra upgrade support on the network

### Our Choice: ERC-4337 Primary, ERC-7702 Ready

We chose **ERC-4337 as the primary standard** for the following reasons:

1. **Production readiness** - ERC-4337 has a mature ecosystem with multiple bundler and paymaster providers (Alchemy, ZeroDev, Pimlico, Biconomy). ERC-7702 is newer and the tooling is still maturing.

2. **Agent wallets are new accounts** - AI agents typically need fresh wallets, not delegation from existing EOAs. ERC-4337's counterfactual deployment model fits this use case perfectly.

3. **Session keys** - ERC-4337 smart accounts support modular validation, enabling session keys with scoped permissions (time-limited, contract-limited, value-limited). This is critical for AI agents that should operate with minimal privileges.

4. **Gas sponsorship** - Paymaster support is native to ERC-4337. Agents can have their gas sponsored, removing the need to pre-fund every agent wallet with ETH.

5. **Batched transactions** - Smart accounts can execute multiple calls atomically in a single UserOperation, which is common for agent workflows.

The architecture is designed so that ERC-7702 support can be added as an alternative account type in the future without breaking changes.

## Provider Abstraction

### Design

The SDK uses the `BundlerProvider` interface to abstract away the specifics of different bundler/paymaster services:

```typescript
interface BundlerProvider {
  readonly name: string;
  initialize(chain: Chain, apiKey: string): Promise<void>;
  createSmartAccount(ownerPrivateKey: Hex, salt?: bigint): Promise<Address>;
  getSmartAccountAddress(ownerPrivateKey: Hex, salt?: bigint): Promise<Address>;
  isAccountDeployed(address: Address): Promise<boolean>;
  sendUserOperation(
    ownerPrivateKey: Hex,
    calls: TransactionRequest[],
    options?: { sponsorGas?: boolean },
  ): Promise<TransactionResult>;
  estimateUserOperationGas(
    ownerPrivateKey: Hex,
    calls: TransactionRequest[],
  ): Promise<GasEstimate>;
  waitForUserOperationReceipt(userOpHash: Hash): Promise<UserOperationReceipt>;
  getBalance(address: Address): Promise<bigint>;
}
```

### Why This Approach

- **Vendor independence** - Users can switch between Alchemy, ZeroDev, or any future provider by changing a single configuration value
- **Testability** - The interface can be mocked in tests without requiring API keys or network access
- **Extensibility** - Adding a new provider (e.g., Pimlico, Biconomy) requires implementing one interface

### Implemented Providers

| Provider | Smart Account Type | Bundler Endpoint                              |
| -------- | ------------------ | --------------------------------------------- |
| Alchemy  | Simple Account     | `https://{network}.g.alchemy.com/v2/{apiKey}` |
| ZeroDev  | Kernel v3          | `https://rpc.zerodev.app/api/v2/bundler/{id}` |

## Key Management & Security

### Encryption

Private keys are encrypted at rest using **AES-256-GCM** with key derivation via **scrypt**:

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key derivation**: scrypt with parameters N=16384, r=8, p=1, dkLen=32
- **Random IV**: 16 bytes per encryption (non-deterministic)
- **Authentication tag**: Prevents tampering with ciphertext

### Storage

Encrypted keys are stored as JSON files in the user's filesystem:

```
~/.arbitrum-wallets/
├── wallets/
│   └── {owner-address}.json
└── sessions/
    └── {wallet-address}/
        └── {session-id}.json
```

### Session Keys

Session keys provide **least-privilege access** for AI agents:

- **Time-limited**: Valid only within a specified time window (`validAfter` to `validUntil`)
- **Contract-limited**: Restrict which contracts the session key can interact with
- **Value-limited**: Cap the maximum value per transaction or total across all transactions
- **Revocable**: Sessions can be revoked immediately by the wallet owner

Session key private keys are encrypted with the same AES-256-GCM scheme as the main wallet key.

## Technology Stack

| Component    | Library/Tool    | Purpose                              |
| ------------ | --------------- | ------------------------------------ |
| Base library | viem            | Ethereum interactions, types, chains |
| AA framework | permissionless  | ERC-4337 primitives                  |
| Build        | TypeScript, tsc | Type-safe compilation                |
| Test         | Vitest          | Unit testing                         |
| Monorepo     | Turborepo       | Task orchestration                   |
| CLI          | Commander.js    | Command-line parsing                 |
| Formatting   | Prettier        | Code formatting                      |
| Linting      | ESLint          | Code quality                         |

## Future Considerations

1. **ERC-7702 support** - Add as an alternative account type for users with existing EOAs
2. **On-chain session key validation** - Deploy session key validator modules on Arbitrum
3. **Multi-sig support** - Allow multiple signers for high-value agent operations
4. **Hardware wallet integration** - Support Ledger/Trezor as the owner key
5. **Event subscriptions** - WebSocket-based monitoring of wallet activity

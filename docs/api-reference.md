# API Reference

Complete reference for the `@arbitrum/agentic-wallets` SDK.

## AgenticWallet

The main entry point. Handles wallet creation, transactions, and session key management.

```typescript
import { AgenticWallet } from '@arbitrum/agentic-wallets';
```

### Constructor

```typescript
const wallet = new AgenticWallet(storageDir?: string);
```

| Parameter    | Type     | Default               | Description                         |
| ------------ | -------- | --------------------- | ----------------------------------- |
| `storageDir` | `string` | `~/.arbitrum-wallets` | Directory for encrypted key storage |

### initialize

Set up the network and provider. Must be called before any wallet operation.

```typescript
await wallet.initialize({
  network: 'arbitrum-one', // 'arbitrum-one' | 'arbitrum-sepolia'
  provider: 'ambire', // 'alchemy' | 'zerodev' | 'ambire'
  apiKey: 'your-api-key',
  salt: 0n, // optional: deterministic address derivation
});
```

**Throws:** `InvalidNetworkError`, `InvalidProviderError`

### createWallet

Generate a new private key, encrypt it, compute the smart account address, and persist.

```typescript
const info = await wallet.createWallet('my-password');
```

**Returns:** `WalletInfo` — address, ownerAddress, network, provider, isDeployed (always `false` for new wallets)

**Throws:** `AgenticWalletError` if not initialized

### importWallet

Import an existing private key. The key is encrypted and a smart account address is computed.

```typescript
const info = await wallet.importWallet('0xprivatekey...', 'my-password');
```

**Returns:** `WalletInfo` — same as `createWallet`, but `isDeployed` reflects actual on-chain status

### getWalletInfo

Look up a stored wallet by ID (lowercase owner address).

```typescript
const info = await wallet.getWalletInfo('0xowner...');
// Returns null if not found
```

### listWallets

Get all stored wallet IDs.

```typescript
const ids = wallet.listWallets(); // ['0xabc...', '0xdef...']
```

### getBalance

Query the native ETH balance of any address.

```typescript
const balance = await wallet.getBalance('0xaddress...');
// balance.balance    → 1500000000000000000n (wei)
// balance.formatted  → '1.5'
// balance.symbol     → 'ETH'
```

### sendTransaction

Send a UserOperation. Supports batching, gas sponsorship, and dry-run simulation.

```typescript
const result = await wallet.sendTransaction('0xowner-lowercase', 'password', {
  calls: [
    { to: '0xrecipient', value: 1000000000000000n },
    { to: '0xcontract', data: '0xa9059cbb...' },
  ],
  sponsorGas: true, // use paymaster (optional)
  dryRun: false, // simulate only (optional)
});
// result.userOpHash       → '0x...'
// result.transactionHash  → '0x...' (after on-chain inclusion)
// result.success          → true
```

**Dry run:** When `dryRun: true`, the transaction is simulated (gas estimated) but not sent. Returns `{ userOpHash: '0x', success: true }` on successful simulation.

### createSessionKey

Create a session key with scoped permissions.

```typescript
const session = await wallet.createSessionKey(
  '0xwallet-address',
  {
    label: 'trading-bot',
    validAfter: Math.floor(Date.now() / 1000),
    validUntil: Math.floor(Date.now() / 1000) + 3600,
    permissions: {
      allowedTargets: ['0xrouter'],
      maxValuePerTransaction: 100000000000000000n,
      maxTransactions: 50,
    },
  },
  'password',
);
// session.info.id                → 'uuid...'
// session.info.sessionKeyAddress → '0x...'
// session.info.isActive          → true
```

### listSessions

List all session keys for a wallet. `isActive` is recalculated based on current time.

```typescript
const sessions = wallet.listSessions('0xwallet...');
for (const s of sessions) {
  console.log(s.id, s.label, s.isActive ? 'ACTIVE' : s.isRevoked ? 'REVOKED' : 'EXPIRED');
}
```

### revokeSession

Immediately revoke a session key. Cannot be undone.

```typescript
wallet.revokeSession('0xwallet...', 'session-uuid');
```

---

## KeyManager

Low-level key operations. Used internally by `AgenticWallet`, but available for direct use.

```typescript
import { KeyManager } from '@arbitrum/agentic-wallets';
const km = new KeyManager();
```

| Method                                   | Returns                     | Description                                  |
| ---------------------------------------- | --------------------------- | -------------------------------------------- |
| `generatePrivateKey()`                   | `Hex`                       | Cryptographically random 32-byte private key |
| `encryptPrivateKey(key, password)`       | `Promise<EncryptedKeyData>` | AES-256-GCM encryption with scrypt KDF       |
| `decryptPrivateKey(encrypted, password)` | `Promise<Hex>`              | Decrypt with password                        |
| `getAddress(key)`                        | `Address`                   | Derive Ethereum address from private key     |

---

## SessionManager

Low-level session key lifecycle. Used internally by `AgenticWallet`.

```typescript
import { SessionManager } from '@arbitrum/agentic-wallets';
const sm = new SessionManager();
```

| Method                                       | Returns                   | Description                                             |
| -------------------------------------------- | ------------------------- | ------------------------------------------------------- |
| `createSessionKey(wallet, config, password)` | `Promise<SessionKeyData>` | Create and store a session key                          |
| `listSessions(wallet)`                       | `SessionKeyInfo[]`        | List sessions (recalculates `isActive`)                 |
| `getSession(wallet, id)`                     | `SessionKeyData \| null`  | Get a specific session                                  |
| `getSessionPrivateKey(wallet, id, password)` | `Promise<Hex>`            | Decrypt session private key (throws if revoked/expired) |
| `revokeSession(wallet, id)`                  | `boolean`                 | Revoke immediately                                      |

---

## Providers

Provider classes that implement `BundlerProvider`. You rarely use these directly — `AgenticWallet` creates them via the factory.

```typescript
import {
  createProvider, // Factory function
  AlchemyProvider,
  ZeroDevProvider,
  AmbireProvider,
} from '@arbitrum/agentic-wallets';

const provider = createProvider('ambire'); // returns AmbireProvider instance
```

| Provider          | `name`      | Bundler Endpoint                       | Gas Sponsorship |
| ----------------- | ----------- | -------------------------------------- | --------------- |
| `AlchemyProvider` | `'alchemy'` | `arb-mainnet.g.alchemy.com/v2/{key}`   | Gas Manager     |
| `ZeroDevProvider` | `'zerodev'` | `rpc.zerodev.app/api/v2/bundler/{key}` | Paymaster       |
| `AmbireProvider`  | `'ambire'`  | `relayer.ambire.com/api/v2/{network}`  | Gas Tank        |

---

## Types

### WalletConfig

```typescript
interface WalletConfig {
  network: SupportedNetwork; // 'arbitrum-one' | 'arbitrum-sepolia'
  provider: ProviderType; // 'alchemy' | 'zerodev' | 'ambire'
  apiKey: string;
  salt?: bigint;
}
```

### WalletInfo

```typescript
interface WalletInfo {
  address: Address; // Smart account address
  isDeployed: boolean; // Has on-chain bytecode?
  ownerAddress: Address; // Owner EOA
  network: SupportedNetwork;
  provider: ProviderType;
}
```

### WalletBalance

```typescript
interface WalletBalance {
  address: Address;
  balance: bigint; // wei
  formatted: string; // e.g. '1.5'
  symbol: string; // 'ETH'
}
```

### TransactionRequest

```typescript
interface TransactionRequest {
  to: Address; // Target address
  value?: bigint; // ETH in wei (default: 0)
  data?: Hex; // Encoded calldata
}
```

### TransactionResult

```typescript
interface TransactionResult {
  userOpHash: Hash; // UserOperation hash
  transactionHash?: Hash; // On-chain tx hash (after inclusion)
  success: boolean;
}
```

### SendTransactionOptions

```typescript
interface SendTransactionOptions {
  calls: TransactionRequest[]; // One or more calls (batching supported)
  sponsorGas?: boolean; // Use paymaster/Gas Tank
  dryRun?: boolean; // Simulate only, don't send
}
```

### SessionKeyPermissions

```typescript
interface SessionKeyPermissions {
  allowedTargets?: Address[]; // Contract whitelist
  allowedFunctions?: Record<string, Hex[]>; // Function selector whitelist per contract
  maxValuePerTransaction?: bigint; // ETH cap per call
  maxTotalValue?: bigint; // Cumulative ETH cap
  maxTransactions?: number; // Max operations
}
```

### SessionKeyConfig

```typescript
interface SessionKeyConfig {
  label: string; // Human-readable name
  validAfter: number; // Unix timestamp (seconds)
  validUntil: number; // Unix timestamp (seconds)
  permissions: SessionKeyPermissions;
}
```

### SessionKeyInfo

```typescript
interface SessionKeyInfo {
  id: string; // UUID
  sessionKeyAddress: Address; // Public address of session key
  label: string;
  validAfter: number;
  validUntil: number;
  permissions: SessionKeyPermissions;
  isActive: boolean; // Recalculated on read
  isRevoked: boolean;
  createdAt: number;
}
```

### BundlerProvider

The abstract interface all providers implement. See [Architecture](./architecture.md) for design rationale.

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
  estimateUserOperationGas(ownerPrivateKey: Hex, calls: TransactionRequest[]): Promise<GasEstimate>;
  waitForUserOperationReceipt(userOpHash: Hash): Promise<UserOperationReceipt>;
  getBalance(address: Address): Promise<bigint>;
}
```

---

## Errors

All errors extend `AgenticWalletError` and include a machine-readable `code` property.

```typescript
try {
  await wallet.sendTransaction(...);
} catch (error) {
  if (error instanceof ProviderError) {
    console.log(error.code);     // 'PROVIDER_ERROR'
    console.log(error.provider); // 'ambire'
    console.log(error.message);  // Human-readable description
  }
}
```

| Error Class            | Code                   | When                                                           |
| ---------------------- | ---------------------- | -------------------------------------------------------------- |
| `AgenticWalletError`   | varies                 | Base class for all SDK errors                                  |
| `InvalidNetworkError`  | `INVALID_NETWORK`      | Network is not `arbitrum-one` or `arbitrum-sepolia`            |
| `InvalidProviderError` | `INVALID_PROVIDER`     | Provider is not `alchemy`, `zerodev`, or `ambire`              |
| `KeyManagementError`   | `KEY_MANAGEMENT_ERROR` | Key encryption/decryption failure                              |
| `SessionKeyError`      | `SESSION_KEY_ERROR`    | Session creation, access, or revocation issue                  |
| `TransactionError`     | `TRANSACTION_ERROR`    | Transaction execution failure                                  |
| `ProviderError`        | `PROVIDER_ERROR`       | Bundler/paymaster operation failed (includes `provider` field) |

# SDK API Reference

## `AgenticWallet`

The main class for managing agent wallets.

```typescript
import { AgenticWallet } from '@arbitrum/agentic-wallets';
```

### Constructor

```typescript
new AgenticWallet(storageDir?: string)
```

- `storageDir` - Optional custom directory for storing wallet data. Defaults to `~/.arbitrum-wallets`.

### `initialize(config: WalletConfig): Promise<void>`

Initialize the wallet with network and provider configuration. Must be called before most operations.

```typescript
await wallet.initialize({
  network: 'arbitrum-one', // or 'arbitrum-sepolia'
  provider: 'alchemy',     // or 'zerodev'
  apiKey: 'your-api-key',
  salt: 0n,                // optional: for deterministic addresses
});
```

### `createWallet(password: string): Promise<WalletInfo>`

Generate a new private key, encrypt it, compute the smart account address, and store the wallet.

```typescript
const info = await wallet.createWallet('my-secure-password');
// info.address       - Smart account address
// info.ownerAddress  - Owner EOA address
// info.network       - Network name
// info.provider      - Provider name
// info.isDeployed    - Always false for new wallets
```

### `importWallet(privateKey: Hex, password: string): Promise<WalletInfo>`

Import an existing private key as a wallet.

```typescript
const info = await wallet.importWallet('0xabc...', 'my-secure-password');
```

### `getWalletInfo(walletId: string): Promise<WalletInfo | null>`

Retrieve stored wallet information by wallet ID (lowercase owner address).

```typescript
const info = await wallet.getWalletInfo('0xabc...');
```

### `listWallets(): string[]`

List all stored wallet IDs.

```typescript
const ids = wallet.listWallets();
```

### `getBalance(address: Address): Promise<WalletBalance>`

Get the native ETH balance of an address.

```typescript
const balance = await wallet.getBalance('0x...');
// balance.balance    - Balance in wei (bigint)
// balance.formatted  - Human-readable string (e.g., "1.5")
// balance.symbol     - "ETH"
```

### `sendTransaction(walletId, password, options): Promise<TransactionResult>`

Send a transaction (UserOperation) from a wallet.

```typescript
const result = await wallet.sendTransaction(
  '0xowner...',
  'password',
  {
    calls: [
      { to: '0xrecipient', value: 1000000000000000n },
      { to: '0xcontract', data: '0x...' },
    ],
    sponsorGas: true,  // optional: use paymaster
    dryRun: false,     // optional: simulate only
  },
);
// result.userOpHash        - UserOperation hash
// result.transactionHash   - On-chain tx hash (after inclusion)
// result.success           - Whether the operation succeeded
```

### `createSessionKey(walletAddress, config, password): Promise<SessionKeyData>`

Create a new session key with scoped permissions.

```typescript
const session = await wallet.createSessionKey(
  '0xwallet...',
  {
    label: 'trading-bot',
    validAfter: Math.floor(Date.now() / 1000),
    validUntil: Math.floor(Date.now() / 1000) + 3600,
    permissions: {
      allowedTargets: ['0xcontract...'],
      maxValuePerTransaction: 1000000000000000n,
      maxTransactions: 100,
    },
  },
  'password',
);
// session.info.id                 - Session UUID
// session.info.sessionKeyAddress  - Session key public address
```

### `listSessions(walletAddress: Address): SessionKeyInfo[]`

List all session keys for a wallet.

```typescript
const sessions = wallet.listSessions('0xwallet...');
for (const s of sessions) {
  console.log(s.id, s.label, s.isActive, s.isRevoked);
}
```

### `revokeSession(walletAddress: Address, sessionId: string): boolean`

Revoke a session key.

```typescript
wallet.revokeSession('0xwallet...', 'session-uuid');
```

---

## `KeyManager`

Low-level key management. Used internally by `AgenticWallet` but available for direct use.

```typescript
import { KeyManager } from '@arbitrum/agentic-wallets';
```

### `generatePrivateKey(): Hex`

Generate a cryptographically random private key.

### `encryptPrivateKey(privateKey: Hex, password: string): Promise<EncryptedKeyData>`

Encrypt a private key with AES-256-GCM using a password-derived key.

### `decryptPrivateKey(encryptedData: EncryptedKeyData, password: string): Promise<Hex>`

Decrypt an encrypted private key.

### `getAddress(privateKey: Hex): Address`

Derive the Ethereum address from a private key.

---

## `SessionManager`

Low-level session key management.

```typescript
import { SessionManager } from '@arbitrum/agentic-wallets';
```

### `createSessionKey(walletAddress, config, password): Promise<SessionKeyData>`

Create and store a new session key.

### `listSessions(walletAddress: Address): SessionKeyInfo[]`

List sessions for a wallet address.

### `getSession(walletAddress, sessionId): SessionKeyData | null`

Get a specific session by ID.

### `getSessionPrivateKey(walletAddress, sessionId, password): Promise<Hex>`

Decrypt and return a session key's private key. Throws if revoked or expired.

### `revokeSession(walletAddress, sessionId): boolean`

Revoke a session key.

---

## Types

### `WalletConfig`

```typescript
interface WalletConfig {
  network: SupportedNetwork;    // 'arbitrum-one' | 'arbitrum-sepolia'
  provider: ProviderType;       // 'alchemy' | 'zerodev'
  apiKey: string;
  salt?: bigint;
}
```

### `WalletInfo`

```typescript
interface WalletInfo {
  address: Address;
  isDeployed: boolean;
  ownerAddress: Address;
  network: SupportedNetwork;
  provider: ProviderType;
}
```

### `WalletBalance`

```typescript
interface WalletBalance {
  address: Address;
  balance: bigint;
  formatted: string;
  symbol: string;
}
```

### `TransactionRequest`

```typescript
interface TransactionRequest {
  to: Address;
  value?: bigint;
  data?: Hex;
}
```

### `TransactionResult`

```typescript
interface TransactionResult {
  userOpHash: Hash;
  transactionHash?: Hash;
  success: boolean;
}
```

### `SendTransactionOptions`

```typescript
interface SendTransactionOptions {
  calls: TransactionRequest[];
  sponsorGas?: boolean;
  dryRun?: boolean;
}
```

### `SessionKeyPermissions`

```typescript
interface SessionKeyPermissions {
  allowedTargets?: Address[];
  allowedFunctions?: Record<string, Hex[]>;
  maxValuePerTransaction?: bigint;
  maxTotalValue?: bigint;
  maxTransactions?: number;
}
```

### `SessionKeyConfig`

```typescript
interface SessionKeyConfig {
  label: string;
  validAfter: number;   // unix timestamp (seconds)
  validUntil: number;   // unix timestamp (seconds)
  permissions: SessionKeyPermissions;
}
```

### `SessionKeyInfo`

```typescript
interface SessionKeyInfo {
  id: string;
  sessionKeyAddress: Address;
  label: string;
  validAfter: number;
  validUntil: number;
  permissions: SessionKeyPermissions;
  isActive: boolean;
  isRevoked: boolean;
  createdAt: number;
}
```

### `BundlerProvider`

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

### Error Classes

All errors extend `AgenticWalletError`:

| Error Class            | Code                   | Description                    |
| ---------------------- | ---------------------- | ------------------------------ |
| `AgenticWalletError`   | (varies)               | Base error class               |
| `InvalidNetworkError`  | `INVALID_NETWORK`      | Unsupported network specified  |
| `InvalidProviderError` | `INVALID_PROVIDER`     | Unsupported provider specified |
| `KeyManagementError`   | `KEY_MANAGEMENT_ERROR` | Key operation failed           |
| `SessionKeyError`      | `SESSION_KEY_ERROR`    | Session key operation failed   |
| `TransactionError`     | `TRANSACTION_ERROR`    | Transaction execution failed   |
| `ProviderError`        | `PROVIDER_ERROR`       | Provider operation failed      |

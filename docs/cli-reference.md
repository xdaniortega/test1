# CLI Reference

The `arbitrum-wallet` CLI provides command-line access to all SDK features.

## Installation

```bash
npm install -g @arbitrum/agentic-wallets-cli
```

## Environment Variables

| Variable                   | Required | Description                              |
| -------------------------- | -------- | ---------------------------------------- |
| `ARBITRUM_WALLET_API_KEY`  | Yes      | API key for the bundler/paymaster provider |
| `ARBITRUM_WALLET_PASSWORD` | Yes      | Password for encrypting/decrypting keys  |

## Global Options

All commands accept:

| Option                          | Default        | Description                        |
| ------------------------------- | -------------- | ---------------------------------- |
| `-n, --network <network>`       | `arbitrum-one` | Network (`arbitrum-one` or `arbitrum-sepolia`) |
| `-p, --provider <provider>`     | `alchemy`      | Provider (`alchemy` or `zerodev`)  |
| `--dry-run`                     | `false`        | Simulate the operation without executing |

## Commands

### `arbitrum-wallet create`

Create a new agent wallet with a fresh private key.

```bash
arbitrum-wallet create [options]

# Examples
arbitrum-wallet create
arbitrum-wallet create --network arbitrum-sepolia
arbitrum-wallet create --network arbitrum-sepolia --provider zerodev
arbitrum-wallet create --dry-run
```

**Output:**

```
Wallet created successfully!
  Address: 0x1234...5678
  Owner: 0xabcd...ef01
  Network: arbitrum-sepolia
  Provider: alchemy
  Deployed: No (counterfactual)
```

### `arbitrum-wallet import <private-key>`

Import an existing private key as an agent wallet.

```bash
arbitrum-wallet import <private-key> [options]

# Example
arbitrum-wallet import 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --network arbitrum-sepolia
```

| Argument        | Description                      |
| --------------- | -------------------------------- |
| `<private-key>` | Private key to import (0x-prefixed hex) |

### `arbitrum-wallet balance <address>`

Check the ETH balance of a wallet address.

```bash
arbitrum-wallet balance <address> [options]

# Example
arbitrum-wallet balance 0x1234567890abcdef1234567890abcdef12345678 \
  --network arbitrum-sepolia
```

| Argument    | Description            |
| ----------- | ---------------------- |
| `<address>` | Wallet address to check |

**Output:**

```
Balance for 0x1234...5678:
  1.5 ETH
  (1500000000000000000 wei)
```

### `arbitrum-wallet send`

Send a transaction from an agent wallet.

```bash
arbitrum-wallet send [options]

# Send ETH
arbitrum-wallet send \
  --wallet 0xOwnerAddress \
  --to 0xRecipient \
  --value 0.01 \
  --network arbitrum-sepolia

# Send with gas sponsorship
arbitrum-wallet send \
  --wallet 0xOwnerAddress \
  --to 0xRecipient \
  --value 0.01 \
  --sponsor-gas

# Send with calldata
arbitrum-wallet send \
  --wallet 0xOwnerAddress \
  --to 0xContract \
  --data 0xa9059cbb...

# Dry run (simulate only)
arbitrum-wallet send \
  --wallet 0xOwnerAddress \
  --to 0xRecipient \
  --value 0.01 \
  --dry-run
```

| Option                | Required | Description                            |
| --------------------- | -------- | -------------------------------------- |
| `-w, --wallet <id>`   | Yes      | Wallet ID (owner address)              |
| `-t, --to <address>`  | Yes      | Recipient address                      |
| `-v, --value <ether>` | No       | Value to send in ETH (default: `0`)    |
| `-d, --data <hex>`    | No       | Transaction calldata (hex-encoded)     |
| `--sponsor-gas`       | No       | Request gas sponsorship via paymaster  |

**Output:**

```
Transaction sent!
  UserOp Hash: 0xabcd...
  Tx Hash: 0x1234...
  Success: true
```

### `arbitrum-wallet info <wallet-id>`

Show detailed wallet information including session keys.

```bash
arbitrum-wallet info <wallet-id> [options]

# Example
arbitrum-wallet info 0xowneraddress --network arbitrum-sepolia
```

| Argument      | Description                          |
| ------------- | ------------------------------------ |
| `<wallet-id>` | Wallet ID (owner address, lowercase) |

**Output:**

```
Wallet info:
  Address: 0x1234...5678
  Owner: 0xabcd...ef01
  Network: arbitrum-sepolia
  Provider: alchemy
  Deployed: No (counterfactual)

  Session Keys: 2
    - trading-bot (ACTIVE)
    - data-fetcher (EXPIRED)
```

### `arbitrum-wallet session create`

Create a new session key with scoped permissions.

```bash
arbitrum-wallet session create [options]

# Basic session (1 hour)
arbitrum-wallet session create \
  --wallet 0xWalletAddress \
  --label "trading-bot"

# Custom duration (24 hours)
arbitrum-wallet session create \
  --wallet 0xWalletAddress \
  --label "data-collector" \
  --duration 86400

# Restricted targets
arbitrum-wallet session create \
  --wallet 0xWalletAddress \
  --label "uniswap-trader" \
  --targets 0xRouter,0xFactory \
  --max-value 1000000000000000000
```

| Option                    | Required | Default | Description                               |
| ------------------------- | -------- | ------- | ----------------------------------------- |
| `-w, --wallet <address>`  | Yes      | -       | Wallet address                            |
| `-l, --label <label>`     | Yes      | -       | Human-readable label                      |
| `-d, --duration <seconds>`| No       | `3600`  | Session duration in seconds               |
| `-t, --targets <addrs>`   | No       | all     | Comma-separated allowed target addresses  |
| `--max-value <wei>`       | No       | none    | Maximum value per transaction in wei      |

**Output:**

```
Session key created!
  ID: 550e8400-e29b-41d4-a716-446655440000
  Address: 0x9876...5432
  Label: trading-bot
  Expires: 2026-03-01T12:00:00.000Z
```

### `arbitrum-wallet session list`

List all session keys for a wallet.

```bash
arbitrum-wallet session list [options]

# Example
arbitrum-wallet session list --wallet 0xWalletAddress
```

| Option                   | Required | Description    |
| ------------------------ | -------- | -------------- |
| `-w, --wallet <address>` | Yes      | Wallet address |

**Output:**

```
Session keys for 0xWalletAddress:

  550e8400-e29b-41d4-a716-446655440000
    Label: trading-bot
    Address: 0x9876...5432
    Status: ACTIVE
    Expires: 2026-03-01T12:00:00.000Z

  661f9511-f3a0-52e5-b827-557766551111
    Label: data-fetcher
    Address: 0xfedc...ba98
    Status: EXPIRED
    Expires: 2026-02-28T06:00:00.000Z
```

### `arbitrum-wallet session revoke`

Revoke a session key immediately.

```bash
arbitrum-wallet session revoke [options]

# Example
arbitrum-wallet session revoke \
  --wallet 0xWalletAddress \
  --session 550e8400-e29b-41d4-a716-446655440000
```

| Option                    | Required | Description          |
| ------------------------- | -------- | -------------------- |
| `-w, --wallet <address>`  | Yes      | Wallet address       |
| `-s, --session <id>`      | Yes      | Session key ID       |

**Output:**

```
Session 550e8400-e29b-41d4-a716-446655440000 has been revoked.
```

# CLI Reference

The `arbitrum-wallet` CLI wraps the SDK for terminal-based wallet management.

## Install

```bash
npm install -g @arbitrum/agentic-wallets-cli
```

## Setup

Two environment variables are required:

```bash
export ARBITRUM_WALLET_API_KEY=your-provider-api-key   # Alchemy, ZeroDev, or Ambire API key
export ARBITRUM_WALLET_PASSWORD=your-encryption-pass    # Used to encrypt/decrypt private keys
```

## Global Options

Every command accepts these flags:

| Flag                        | Default        | Description                          |
| --------------------------- | -------------- | ------------------------------------ |
| `-n, --network <network>`   | `arbitrum-one` | `arbitrum-one` or `arbitrum-sepolia` |
| `-p, --provider <provider>` | `alchemy`      | `alchemy`, `zerodev`, or `ambire`    |
| `--dry-run`                 | off            | Simulate without executing           |

## Commands

### create

Create a new agent wallet. Generates a private key, encrypts it, and computes the smart account address.

```bash
arbitrum-wallet create
arbitrum-wallet create --network arbitrum-sepolia --provider ambire
arbitrum-wallet create --dry-run
```

Output:

```
Wallet created successfully!
  Address: 0x1234...5678
  Owner: 0xabcd...ef01
  Network: arbitrum-sepolia
  Provider: ambire
  Deployed: No (counterfactual)
```

### import

Import an existing private key as an agent wallet.

```bash
arbitrum-wallet import 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
arbitrum-wallet import 0xYourKey --network arbitrum-sepolia --provider zerodev
```

### balance

Check the ETH balance of any address.

```bash
arbitrum-wallet balance 0xAddress
arbitrum-wallet balance 0xAddress --network arbitrum-sepolia
```

Output:

```
Balance for 0x1234...5678:
  1.5 ETH
  (1500000000000000000 wei)
```

### send

Send a transaction (UserOperation) from a wallet.

```bash
# Send ETH
arbitrum-wallet send -w 0xOwner -t 0xRecipient -v 0.01

# With gas sponsorship (paymaster / Ambire Gas Tank)
arbitrum-wallet send -w 0xOwner -t 0xRecipient -v 0.01 --sponsor-gas --provider ambire

# With calldata
arbitrum-wallet send -w 0xOwner -t 0xContract -d 0xa9059cbb...

# Dry run (simulate only)
arbitrum-wallet send -w 0xOwner -t 0xRecipient -v 0.01 --dry-run
```

| Flag                  | Required | Default | Description               |
| --------------------- | -------- | ------- | ------------------------- |
| `-w, --wallet <id>`   | Yes      | —       | Wallet ID (owner address) |
| `-t, --to <address>`  | Yes      | —       | Recipient address         |
| `-v, --value <ether>` | No       | `0`     | ETH amount to send        |
| `-d, --data <hex>`    | No       | —       | Encoded calldata          |
| `--sponsor-gas`       | No       | off     | Use paymaster for gas     |

Output:

```
Transaction sent!
  UserOp Hash: 0xabcd...
  Tx Hash: 0x1234...
  Success: true
```

### info

Show wallet details and session key summary.

```bash
arbitrum-wallet info 0xowner-address
arbitrum-wallet info 0xowner --network arbitrum-sepolia
```

Output:

```
Wallet info:
  Address: 0x1234...5678
  Owner: 0xabcd...ef01
  Network: arbitrum-sepolia
  Provider: ambire
  Deployed: No (counterfactual)

  Session Keys: 2
    - trading-bot (ACTIVE)
    - data-fetcher (EXPIRED)
```

### session create

Create a session key with scoped permissions.

```bash
# 1 hour session (default)
arbitrum-wallet session create -w 0xWallet -l "trading-bot"

# 24 hour session with contract restriction
arbitrum-wallet session create \
  -w 0xWallet \
  -l "uniswap-trader" \
  -d 86400 \
  -t 0xRouter,0xFactory \
  --max-value 1000000000000000000
```

| Flag                       | Required | Default   | Description                       |
| -------------------------- | -------- | --------- | --------------------------------- |
| `-w, --wallet <address>`   | Yes      | —         | Wallet address                    |
| `-l, --label <label>`      | Yes      | —         | Human-readable label              |
| `-d, --duration <seconds>` | No       | `3600`    | Session duration                  |
| `-t, --targets <addrs>`    | No       | all       | Comma-separated allowed contracts |
| `--max-value <wei>`        | No       | unlimited | Max ETH per transaction (wei)     |

Output:

```
Session key created!
  ID: 550e8400-e29b-41d4-a716-446655440000
  Address: 0x9876...5432
  Label: trading-bot
  Expires: 2026-03-01T12:00:00.000Z
```

### session list

List all session keys for a wallet.

```bash
arbitrum-wallet session list -w 0xWallet
```

Output:

```
Session keys for 0xWallet:

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

### session revoke

Revoke a session key immediately.

```bash
arbitrum-wallet session revoke -w 0xWallet -s 550e8400-e29b-41d4-a716-446655440000
```

Output:

```
Session 550e8400-e29b-41d4-a716-446655440000 has been revoked.
```

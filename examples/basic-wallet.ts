/**
 * Basic Agent Wallet Example
 *
 * Demonstrates creating a new wallet, checking its balance,
 * and sending a simple ETH transfer.
 *
 * Prerequisites:
 *   - An Alchemy API key (or ZeroDev project ID)
 *   - Some testnet ETH on Arbitrum Sepolia for sending transactions
 *
 * Usage:
 *   npx tsx examples/basic-wallet.ts
 */

import { AgenticWallet } from '@arbitrum/agentic-wallets';
import type { Address } from 'viem';

const API_KEY = process.env['ALCHEMY_API_KEY'];
const PASSWORD = 'example-secure-password-change-me';

if (!API_KEY) {
  console.error('Set ALCHEMY_API_KEY environment variable');
  process.exit(1);
}

async function main() {
  // 1. Create the wallet instance
  const wallet = new AgenticWallet();

  // 2. Initialize with Arbitrum Sepolia (testnet) and Alchemy provider
  await wallet.initialize({
    network: 'arbitrum-sepolia',
    provider: 'alchemy',
    apiKey: API_KEY!,
  });

  console.log('Wallet SDK initialized on Arbitrum Sepolia\n');

  // 3. Create a new agent wallet
  const info = await wallet.createWallet(PASSWORD);
  console.log('New wallet created:');
  console.log(`  Smart Account: ${info.address}`);
  console.log(`  Owner EOA:     ${info.ownerAddress}`);
  console.log(`  Deployed:      ${info.isDeployed ? 'Yes' : 'No (counterfactual)'}`);
  console.log();

  // 4. Check balance
  const balance = await wallet.getBalance(info.address);
  console.log(`Balance: ${balance.formatted} ${balance.symbol}`);
  console.log();

  // 5. List all wallets
  const walletIds = wallet.listWallets();
  console.log(`Stored wallets: ${walletIds.length}`);
  for (const id of walletIds) {
    console.log(`  - ${id}`);
  }
  console.log();

  // 6. Send a transaction (dry run - simulation only)
  const RECIPIENT = '0x0000000000000000000000000000000000000001' as Address;
  console.log('Simulating a transaction (dry run)...');

  const result = await wallet.sendTransaction(info.ownerAddress.toLowerCase(), PASSWORD, {
    calls: [{ to: RECIPIENT, value: 0n }],
    dryRun: true,
  });

  console.log(`  Simulation result: ${result.success ? 'Success' : 'Failed'}`);
}

main().catch(console.error);

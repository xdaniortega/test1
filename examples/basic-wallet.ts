/**
 * Basic Agent Wallet
 *
 * Creates an agent wallet on Arbitrum Sepolia, checks balance,
 * and simulates a transaction. Works with any provider
 * (Alchemy, ZeroDev, or Ambire).
 *
 * Run:
 *   PROVIDER_API_KEY=your-key npx tsx examples/basic-wallet.ts
 */

import { AgenticWallet } from '@arbitrum/agentic-wallets';
import type { Address } from 'viem';

const API_KEY = process.env['PROVIDER_API_KEY'];
const PASSWORD = 'change-this-in-production-min-8-chars';

// Pick your provider: 'alchemy' | 'zerodev' | 'ambire'
const PROVIDER = (process.env['PROVIDER'] ?? 'alchemy') as 'alchemy' | 'zerodev' | 'ambire';

if (!API_KEY) {
  console.error('Usage: PROVIDER_API_KEY=your-key npx tsx examples/basic-wallet.ts');
  console.error('Optional: PROVIDER=ambire (default: alchemy)');
  process.exit(1);
}

async function main() {
  const wallet = new AgenticWallet();

  // Initialize — change 'provider' to switch between Alchemy, ZeroDev, or Ambire
  await wallet.initialize({
    network: 'arbitrum-sepolia',
    provider: PROVIDER,
    apiKey: API_KEY!,
  });

  console.log(`Initialized with ${PROVIDER} on Arbitrum Sepolia\n`);

  // Create a new agent wallet
  // The private key is generated and encrypted with AES-256-GCM automatically
  const agent = await wallet.createWallet(PASSWORD);
  console.log('Agent wallet created:');
  console.log(`  Smart Account: ${agent.address}`);
  console.log(`  Owner EOA:     ${agent.ownerAddress}`);
  console.log(`  Provider:      ${agent.provider}`);
  console.log(`  Deployed:      ${agent.isDeployed ? 'Yes' : 'No (counterfactual)'}\n`);

  // Check balance
  const balance = await wallet.getBalance(agent.address);
  console.log(`Balance: ${balance.formatted} ${balance.symbol}\n`);

  // List stored wallets
  const ids = wallet.listWallets();
  console.log(`Stored wallets: ${ids.length}`);
  for (const id of ids) {
    console.log(`  - ${id}`);
  }
  console.log();

  // Simulate a transaction (dry run — no gas needed)
  const RECIPIENT = '0x0000000000000000000000000000000000000001' as Address;
  console.log('Simulating transaction (dry run)...');

  const result = await wallet.sendTransaction(agent.ownerAddress.toLowerCase(), PASSWORD, {
    calls: [{ to: RECIPIENT, value: 0n }],
    dryRun: true,
  });

  console.log(`  Result: ${result.success ? 'OK' : 'Failed'}`);
}

main().catch(console.error);

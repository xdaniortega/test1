/**
 * Gas-Sponsored Transactions
 *
 * Agent wallets shouldn't need pre-funded ETH to operate.
 * With `sponsorGas: true`, the provider's paymaster covers gas:
 *
 *   - Alchemy: Gas Manager policies
 *   - ZeroDev: Paymaster integration
 *   - Ambire: Gas Tank (pay gas in USDC, DAI, or ~100 other tokens)
 *
 * This example also shows batching — multiple calls in one
 * atomic UserOperation.
 *
 * Run:
 *   PROVIDER_API_KEY=your-key npx tsx examples/gas-sponsored.ts
 *   PROVIDER_API_KEY=your-key PROVIDER=ambire npx tsx examples/gas-sponsored.ts
 */

import { AgenticWallet } from '@arbitrum/agentic-wallets';
import type { Address, Hex } from 'viem';

const API_KEY = process.env['PROVIDER_API_KEY'];
const PASSWORD = 'change-this-in-production-min-8-chars';
const PROVIDER = (process.env['PROVIDER'] ?? 'alchemy') as 'alchemy' | 'zerodev' | 'ambire';

if (!API_KEY) {
  console.error('Usage: PROVIDER_API_KEY=your-key npx tsx examples/gas-sponsored.ts');
  process.exit(1);
}

async function main() {
  const wallet = new AgenticWallet();

  await wallet.initialize({
    network: 'arbitrum-sepolia',
    provider: PROVIDER,
    apiKey: API_KEY!,
  });

  console.log(`=== Gas-Sponsored Transactions (${PROVIDER}) ===\n`);

  // Create a fresh agent wallet — it has 0 ETH
  const agent = await wallet.createWallet(PASSWORD);
  console.log(`Agent wallet: ${agent.address}`);
  console.log(`Owner:        ${agent.ownerAddress}`);

  const balance = await wallet.getBalance(agent.address);
  console.log(`Balance:      ${balance.formatted} ${balance.symbol}`);
  console.log('The agent has no ETH, but can still transact via gas sponsorship.\n');

  // --- Single gasless transaction (dry run) ---
  const RECIPIENT = '0x0000000000000000000000000000000000000001' as Address;

  console.log('1. Single gasless transaction (dry run)');
  const result = await wallet.sendTransaction(agent.ownerAddress.toLowerCase(), PASSWORD, {
    calls: [{ to: RECIPIENT, value: 0n }],
    sponsorGas: true,
    dryRun: true,
  });
  console.log(`   Result: ${result.success ? 'OK' : 'Failed'}\n`);

  // --- Batched gasless transaction (dry run) ---
  // Smart accounts can execute multiple calls atomically
  // This is a common DeFi pattern: approve + swap in one tx
  const APPROVE_SELECTOR = '0x095ea7b3' as Hex;
  const SWAP_SELECTOR = '0x38ed1739' as Hex;
  const TOKEN = '0x0000000000000000000000000000000000000002' as Address;
  const ROUTER = '0x0000000000000000000000000000000000000003' as Address;

  console.log('2. Batched gasless transaction (dry run)');
  console.log('   Call 1: ERC-20 approve → token contract');
  console.log('   Call 2: Swap           → DEX router');

  const batchResult = await wallet.sendTransaction(agent.ownerAddress.toLowerCase(), PASSWORD, {
    calls: [
      { to: TOKEN, data: APPROVE_SELECTOR },
      { to: ROUTER, data: SWAP_SELECTOR },
    ],
    sponsorGas: true,
    dryRun: true,
  });

  console.log(`   Result: ${batchResult.success ? 'OK' : 'Failed'}\n`);
  console.log('Both calls execute atomically in one UserOperation.');
  console.log('Gas is covered by the paymaster — the agent pays nothing.');
  if (PROVIDER === 'ambire') {
    console.log("With Ambire's Gas Tank, gas can be pre-paid in USDC or ~100 other tokens.");
  }
}

main().catch(console.error);

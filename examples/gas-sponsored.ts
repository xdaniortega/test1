/**
 * Gas-Sponsored Transactions Example
 *
 * Demonstrates sending transactions with gas sponsorship via a paymaster.
 * When `sponsorGas: true` is set, the bundler provider requests the paymaster
 * to cover gas costs, so the agent wallet does not need to hold ETH for gas.
 *
 * This is useful for:
 *   - Onboarding new agents without pre-funding gas
 *   - Subsidizing agent operations
 *   - Providing a gasless UX for agent-initiated transactions
 *
 * Prerequisites:
 *   - An Alchemy API key with Gas Manager policy configured, or
 *     a ZeroDev project with paymaster enabled
 *
 * Usage:
 *   npx tsx examples/gas-sponsored.ts
 */

import { AgenticWallet } from '@arbitrum/agentic-wallets';
import type { Address, Hex } from 'viem';

const API_KEY = process.env['ALCHEMY_API_KEY'];
const PASSWORD = 'example-secure-password-change-me';

if (!API_KEY) {
  console.error('Set ALCHEMY_API_KEY environment variable');
  process.exit(1);
}

async function main() {
  const wallet = new AgenticWallet();

  await wallet.initialize({
    network: 'arbitrum-sepolia',
    provider: 'alchemy',
    apiKey: API_KEY!,
  });

  console.log('Gas-Sponsored Transaction Demo\n');

  // 1. Create a wallet for the agent
  const info = await wallet.createWallet(PASSWORD);
  console.log(`Agent wallet: ${info.address}`);
  console.log(`Owner:        ${info.ownerAddress}\n`);

  // 2. Check balance (should be 0 - the agent has no ETH)
  const balance = await wallet.getBalance(info.address);
  console.log(`Balance: ${balance.formatted} ${balance.symbol}`);
  console.log('Agent has no ETH, but can still send gas-sponsored transactions.\n');

  // 3. Send a gas-sponsored transaction (dry run)
  const RECIPIENT = '0x0000000000000000000000000000000000000001' as Address;

  console.log('Sending gas-sponsored transaction (dry run)...');
  const result = await wallet.sendTransaction(
    info.ownerAddress.toLowerCase(),
    PASSWORD,
    {
      calls: [{ to: RECIPIENT, value: 0n }],
      sponsorGas: true,
      dryRun: true,
    },
  );
  console.log(`  Result: ${result.success ? 'Success' : 'Failed'}\n`);

  // 4. Batched gas-sponsored transaction (dry run)
  // Smart accounts can batch multiple calls into a single UserOperation
  const ERC20_TRANSFER_SELECTOR = '0xa9059cbb' as Hex;
  const TOKEN_CONTRACT = '0x0000000000000000000000000000000000000002' as Address;
  const DEX_ROUTER = '0x0000000000000000000000000000000000000003' as Address;

  console.log('Sending batched gas-sponsored transaction (dry run)...');
  console.log('  Call 1: ERC-20 approve on token contract');
  console.log('  Call 2: Swap on DEX router');

  const batchResult = await wallet.sendTransaction(
    info.ownerAddress.toLowerCase(),
    PASSWORD,
    {
      calls: [
        {
          to: TOKEN_CONTRACT,
          data: ERC20_TRANSFER_SELECTOR,
        },
        {
          to: DEX_ROUTER,
          data: ERC20_TRANSFER_SELECTOR,
        },
      ],
      sponsorGas: true,
      dryRun: true,
    },
  );

  console.log(`  Result: ${batchResult.success ? 'Success' : 'Failed'}`);
  console.log('\nBoth calls would execute atomically in a single UserOperation.');
  console.log('Gas is covered by the paymaster - the agent wallet pays nothing.');
}

main().catch(console.error);

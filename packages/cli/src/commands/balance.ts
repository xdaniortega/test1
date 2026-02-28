import { type Command } from 'commander';
import { AgenticWallet, type SupportedNetwork, type ProviderType } from '@arbitrum/agentic-wallets';
import { type Address } from 'viem';
import { addGlobalOptions, handleError, requireApiKey } from './common.js';

export function registerBalanceCommand(program: Command): void {
  const cmd = program
    .command('balance')
    .description('Check the balance of a wallet')
    .argument('<address>', 'Wallet address to check');

  addGlobalOptions(cmd);

  cmd.action(
    async (address: string, options: { network: string; provider: string; dryRun?: boolean }) => {
      try {
        const apiKey = requireApiKey();

        if (options.dryRun) {
          console.log(`Dry run: would check balance of ${address}`);
          console.log(`  Network: ${options.network}`);
          return;
        }

        const wallet = new AgenticWallet();
        await wallet.initialize({
          network: options.network as SupportedNetwork,
          provider: options.provider as ProviderType,
          apiKey,
        });

        const balance = await wallet.getBalance(address as Address);

        console.log(`Balance for ${address}:`);
        console.log(`  ${balance.formatted} ${balance.symbol}`);
        console.log(`  (${balance.balance} wei)`);
      } catch (error) {
        handleError(error);
      }
    },
  );
}

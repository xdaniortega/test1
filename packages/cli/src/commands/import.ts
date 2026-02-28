import { type Command } from 'commander';
import { AgenticWallet, type SupportedNetwork, type ProviderType } from '@arbitrum/agentic-wallets';
import { type Hex } from 'viem';
import { addGlobalOptions, handleError, requireApiKey, requirePassword } from './common.js';

export function registerImportCommand(program: Command): void {
  const cmd = program
    .command('import')
    .description('Import an existing private key as an agent wallet')
    .argument('<private-key>', 'Private key to import (0x-prefixed hex)');

  addGlobalOptions(cmd);

  cmd.action(
    async (
      privateKey: string,
      options: { network: string; provider: string; dryRun?: boolean },
    ) => {
      try {
        const apiKey = requireApiKey();
        const password = requirePassword();

        if (options.dryRun) {
          console.log('Dry run: would import wallet from private key');
          console.log(`  Network: ${options.network}`);
          console.log(`  Provider: ${options.provider}`);
          return;
        }

        const wallet = new AgenticWallet();
        await wallet.initialize({
          network: options.network as SupportedNetwork,
          provider: options.provider as ProviderType,
          apiKey,
        });

        const info = await wallet.importWallet(privateKey as Hex, password);

        console.log('Wallet imported successfully!');
        console.log(`  Address: ${info.address}`);
        console.log(`  Owner: ${info.ownerAddress}`);
        console.log(`  Network: ${info.network}`);
        console.log(`  Provider: ${info.provider}`);
      } catch (error) {
        handleError(error);
      }
    },
  );
}

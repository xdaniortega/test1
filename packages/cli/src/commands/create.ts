import { type Command } from 'commander';
import { AgenticWallet, type SupportedNetwork, type ProviderType } from '@arbitrum/agentic-wallets';
import { addGlobalOptions, handleError, requireApiKey, requirePassword } from './common.js';

export function registerCreateCommand(program: Command): void {
  const cmd = program.command('create').description('Create a new agent wallet');

  addGlobalOptions(cmd);

  cmd.action(async (options: { network: string; provider: string; dryRun?: boolean }) => {
    try {
      const apiKey = requireApiKey();
      const password = requirePassword();

      if (options.dryRun) {
        console.log('Dry run: would create a new wallet');
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

      const info = await wallet.createWallet(password);

      console.log('Wallet created successfully!');
      console.log(`  Address: ${info.address}`);
      console.log(`  Owner: ${info.ownerAddress}`);
      console.log(`  Network: ${info.network}`);
      console.log(`  Provider: ${info.provider}`);
      console.log(`  Deployed: ${info.isDeployed ? 'Yes' : 'No (counterfactual)'}`);
    } catch (error) {
      handleError(error);
    }
  });
}

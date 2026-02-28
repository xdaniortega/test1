import { type Command } from 'commander';
import { AgenticWallet, type SupportedNetwork, type ProviderType } from '@arbitrum/agentic-wallets';
import { addGlobalOptions, handleError, requireApiKey } from './common.js';

export function registerInfoCommand(program: Command): void {
  const cmd = program
    .command('info')
    .description('Show wallet details')
    .argument('<wallet-id>', 'Wallet ID (owner address, lowercase)');

  addGlobalOptions(cmd);

  cmd.action(
    async (walletId: string, options: { network: string; provider: string; dryRun?: boolean }) => {
      try {
        const apiKey = requireApiKey();

        if (options.dryRun) {
          console.log(`Dry run: would show info for wallet ${walletId}`);
          return;
        }

        const wallet = new AgenticWallet();
        await wallet.initialize({
          network: options.network as SupportedNetwork,
          provider: options.provider as ProviderType,
          apiKey,
        });

        const info = await wallet.getWalletInfo(walletId.toLowerCase());

        if (!info) {
          console.error(`Wallet not found: ${walletId}`);
          process.exit(1);
        }

        console.log(`Wallet info:`);
        console.log(`  Address: ${info.address}`);
        console.log(`  Owner: ${info.ownerAddress}`);
        console.log(`  Network: ${info.network}`);
        console.log(`  Provider: ${info.provider}`);
        console.log(`  Deployed: ${info.isDeployed ? 'Yes' : 'No (counterfactual)'}`);

        // List sessions
        const sessions = wallet.listSessions(info.address);
        if (sessions.length > 0) {
          console.log(`\n  Session Keys: ${sessions.length}`);
          for (const session of sessions) {
            const status = session.isRevoked ? 'REVOKED' : session.isActive ? 'ACTIVE' : 'EXPIRED';
            console.log(`    - ${session.label} (${status})`);
          }
        }
      } catch (error) {
        handleError(error);
      }
    },
  );
}

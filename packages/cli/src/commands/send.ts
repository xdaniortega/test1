import { type Command } from 'commander';
import { AgenticWallet, type SupportedNetwork, type ProviderType } from '@arbitrum/agentic-wallets';
import { type Address, type Hex, parseEther } from 'viem';
import { addGlobalOptions, handleError, requireApiKey, requirePassword } from './common.js';

export function registerSendCommand(program: Command): void {
  const cmd = program
    .command('send')
    .description('Send a transaction from an agent wallet')
    .requiredOption('-w, --wallet <id>', 'Wallet ID (owner address)')
    .requiredOption('-t, --to <address>', 'Recipient address')
    .option('-v, --value <ether>', 'Value to send in ETH', '0')
    .option('-d, --data <hex>', 'Transaction calldata (hex)')
    .option('--sponsor-gas', 'Request gas sponsorship via paymaster');

  addGlobalOptions(cmd);

  cmd.action(
    async (options: {
      wallet: string;
      to: string;
      value: string;
      data?: string;
      sponsorGas?: boolean;
      network: string;
      provider: string;
      dryRun?: boolean;
    }) => {
      try {
        const apiKey = requireApiKey();
        const password = requirePassword();

        const wallet = new AgenticWallet();
        await wallet.initialize({
          network: options.network as SupportedNetwork,
          provider: options.provider as ProviderType,
          apiKey,
        });

        const result = await wallet.sendTransaction(options.wallet.toLowerCase(), password, {
          calls: [
            {
              to: options.to as Address,
              value: parseEther(options.value),
              data: options.data as Hex | undefined,
            },
          ],
          sponsorGas: options.sponsorGas,
          dryRun: options.dryRun,
        });

        if (options.dryRun) {
          console.log('Dry run: transaction simulated successfully');
          console.log(`  To: ${options.to}`);
          console.log(`  Value: ${options.value} ETH`);
          return;
        }

        console.log('Transaction sent!');
        console.log(`  UserOp Hash: ${result.userOpHash}`);
        if (result.transactionHash) {
          console.log(`  Tx Hash: ${result.transactionHash}`);
        }
        console.log(`  Success: ${result.success}`);
      } catch (error) {
        handleError(error);
      }
    },
  );
}

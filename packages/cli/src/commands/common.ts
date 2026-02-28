import { type Command } from 'commander';
import { type SupportedNetwork, type ProviderType } from '@arbitrum/agentic-wallets';

export interface GlobalOptions {
  network: SupportedNetwork;
  provider: ProviderType;
  dryRun?: boolean;
}

export function addGlobalOptions(cmd: Command): Command {
  return cmd
    .option(
      '-n, --network <network>',
      'Network to use (arbitrum-one or arbitrum-sepolia)',
      'arbitrum-one',
    )
    .option(
      '-p, --provider <provider>',
      'Provider to use (alchemy or zerodev)',
      'alchemy',
    )
    .option('--dry-run', 'Simulate the operation without executing');
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function handleError(error: unknown): never {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error(`Error: ${String(error)}`);
  }
  process.exit(1);
}

export function requireApiKey(): string {
  const key = process.env['ARBITRUM_WALLET_API_KEY'];
  if (!key) {
    console.error('Error: ARBITRUM_WALLET_API_KEY environment variable is required.');
    console.error('Set it with: export ARBITRUM_WALLET_API_KEY=your-api-key');
    process.exit(1);
  }
  return key;
}

export function requirePassword(): string {
  const password = process.env['ARBITRUM_WALLET_PASSWORD'];
  if (!password) {
    console.error('Error: ARBITRUM_WALLET_PASSWORD environment variable is required.');
    console.error('Set it with: export ARBITRUM_WALLET_PASSWORD=your-password');
    process.exit(1);
  }
  return password;
}

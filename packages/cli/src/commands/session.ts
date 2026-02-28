import { type Command } from 'commander';
import { AgenticWallet } from '@arbitrum/agentic-wallets';
import { type Address } from 'viem';
import { addGlobalOptions, handleError, requirePassword } from './common.js';

export function registerSessionCommand(program: Command): void {
  const session = program.command('session').description('Manage session keys');

  // session create
  const createCmd = session
    .command('create')
    .description('Create a new session key with scoped permissions')
    .requiredOption('-w, --wallet <address>', 'Wallet address')
    .requiredOption('-l, --label <label>', 'Human-readable label for the session')
    .option('-d, --duration <seconds>', 'Session duration in seconds', '3600')
    .option('-t, --targets <addresses>', 'Comma-separated allowed target addresses')
    .option('--max-value <wei>', 'Maximum value per transaction in wei');

  addGlobalOptions(createCmd);

  createCmd.action(
    async (options: {
      wallet: string;
      label: string;
      duration: string;
      targets?: string;
      maxValue?: string;
      network: string;
      provider: string;
      dryRun?: boolean;
    }) => {
      try {
        const password = requirePassword();
        const now = Math.floor(Date.now() / 1000);
        const duration = parseInt(options.duration, 10);

        if (options.dryRun) {
          console.log('Dry run: would create session key');
          console.log(`  Wallet: ${options.wallet}`);
          console.log(`  Label: ${options.label}`);
          console.log(`  Duration: ${duration}s`);
          return;
        }

        const wallet = new AgenticWallet();

        const sessionData = await wallet.createSessionKey(
          options.wallet as Address,
          {
            label: options.label,
            validAfter: now,
            validUntil: now + duration,
            permissions: {
              allowedTargets: options.targets
                ? (options.targets.split(',') as Address[])
                : undefined,
              maxValuePerTransaction: options.maxValue ? BigInt(options.maxValue) : undefined,
            },
          },
          password,
        );

        console.log('Session key created!');
        console.log(`  ID: ${sessionData.info.id}`);
        console.log(`  Address: ${sessionData.info.sessionKeyAddress}`);
        console.log(`  Label: ${sessionData.info.label}`);
        console.log(`  Expires: ${new Date(sessionData.info.validUntil * 1000).toISOString()}`);
      } catch (error) {
        handleError(error);
      }
    },
  );

  // session list
  const listCmd = session
    .command('list')
    .description('List active session keys')
    .requiredOption('-w, --wallet <address>', 'Wallet address');

  addGlobalOptions(listCmd);

  listCmd.action(async (options: { wallet: string; dryRun?: boolean }) => {
    try {
      if (options.dryRun) {
        console.log(`Dry run: would list sessions for ${options.wallet}`);
        return;
      }

      const wallet = new AgenticWallet();
      const sessions = wallet.listSessions(options.wallet as Address);

      if (sessions.length === 0) {
        console.log('No session keys found.');
        return;
      }

      console.log(`Session keys for ${options.wallet}:\n`);
      for (const session of sessions) {
        const status = session.isRevoked
          ? 'REVOKED'
          : session.isActive
            ? 'ACTIVE'
            : 'EXPIRED';
        console.log(`  ${session.id}`);
        console.log(`    Label: ${session.label}`);
        console.log(`    Address: ${session.sessionKeyAddress}`);
        console.log(`    Status: ${status}`);
        console.log(`    Expires: ${new Date(session.validUntil * 1000).toISOString()}`);
        console.log();
      }
    } catch (error) {
      handleError(error);
    }
  });

  // session revoke
  const revokeCmd = session
    .command('revoke')
    .description('Revoke a session key')
    .requiredOption('-w, --wallet <address>', 'Wallet address')
    .requiredOption('-s, --session <id>', 'Session key ID to revoke');

  addGlobalOptions(revokeCmd);

  revokeCmd.action(
    async (options: { wallet: string; session: string; dryRun?: boolean }) => {
      try {
        if (options.dryRun) {
          console.log(`Dry run: would revoke session ${options.session}`);
          return;
        }

        const wallet = new AgenticWallet();
        wallet.revokeSession(options.wallet as Address, options.session);

        console.log(`Session ${options.session} has been revoked.`);
      } catch (error) {
        handleError(error);
      }
    },
  );
}

/**
 * Session Key Management Example
 *
 * Demonstrates creating session keys with scoped permissions,
 * listing active sessions, and revoking them.
 *
 * Session keys allow AI agents to operate with minimal privileges:
 *   - Time-limited: expire after a set duration
 *   - Contract-limited: restrict which contracts can be called
 *   - Value-limited: cap the amount of ETH per transaction
 *
 * Usage:
 *   npx tsx examples/session-keys.ts
 */

import { AgenticWallet } from '@arbitrum/agentic-wallets';
import type { Address } from 'viem';

const PASSWORD = 'example-secure-password-change-me';

async function main() {
  const wallet = new AgenticWallet();

  // Use a sample wallet address for demonstration
  const WALLET_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678' as Address;
  const now = Math.floor(Date.now() / 1000);

  console.log('Session Key Management Demo\n');

  // 1. Create a session key for a trading bot (1 hour, restricted to a DEX router)
  console.log('Creating session key: trading-bot');
  const tradingSession = await wallet.createSessionKey(
    WALLET_ADDRESS,
    {
      label: 'trading-bot',
      validAfter: now,
      validUntil: now + 3600, // 1 hour
      permissions: {
        allowedTargets: ['0xE592427A0AEce92De3Edee1F18E0157C05861564' as Address],
        maxValuePerTransaction: 100000000000000000n, // 0.1 ETH
        maxTransactions: 50,
      },
    },
    PASSWORD,
  );

  console.log(`  ID:      ${tradingSession.info.id}`);
  console.log(`  Address: ${tradingSession.info.sessionKeyAddress}`);
  console.log(`  Active:  ${tradingSession.info.isActive}`);
  console.log(`  Expires: ${new Date(tradingSession.info.validUntil * 1000).toISOString()}`);
  console.log();

  // 2. Create another session key for a data collection agent (24 hours, read-only)
  console.log('Creating session key: data-collector');
  const dataSession = await wallet.createSessionKey(
    WALLET_ADDRESS,
    {
      label: 'data-collector',
      validAfter: now,
      validUntil: now + 86400, // 24 hours
      permissions: {
        maxValuePerTransaction: 0n, // Cannot send any value
        maxTransactions: 1000,
      },
    },
    PASSWORD,
  );

  console.log(`  ID:      ${dataSession.info.id}`);
  console.log(`  Address: ${dataSession.info.sessionKeyAddress}`);
  console.log(`  Active:  ${dataSession.info.isActive}`);
  console.log(`  Expires: ${new Date(dataSession.info.validUntil * 1000).toISOString()}`);
  console.log();

  // 3. List all sessions
  console.log('All session keys:');
  const sessions = wallet.listSessions(WALLET_ADDRESS);
  for (const session of sessions) {
    const status = session.isRevoked ? 'REVOKED' : session.isActive ? 'ACTIVE' : 'EXPIRED';
    console.log(`  [${status}] ${session.label} (${session.id})`);
  }
  console.log();

  // 4. Revoke the trading bot session
  console.log(`Revoking session: ${tradingSession.info.id}`);
  wallet.revokeSession(WALLET_ADDRESS, tradingSession.info.id);
  console.log('  Session revoked.\n');

  // 5. List sessions again to see updated status
  console.log('Sessions after revocation:');
  const updatedSessions = wallet.listSessions(WALLET_ADDRESS);
  for (const session of updatedSessions) {
    const status = session.isRevoked ? 'REVOKED' : session.isActive ? 'ACTIVE' : 'EXPIRED';
    console.log(`  [${status}] ${session.label} (${session.id})`);
  }
}

main().catch(console.error);

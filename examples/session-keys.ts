/**
 * Session Key Management
 *
 * Session keys are the core security feature for agent wallets.
 * Instead of giving an agent the master key, you create scoped
 * credentials with specific limits:
 *
 *   - Time-limited: auto-expire after a set duration
 *   - Contract-scoped: can only call whitelisted contracts
 *   - Value-capped: max ETH per transaction or total
 *   - Revocable: kill a session instantly if needed
 *
 * This example runs locally — no API key or network needed.
 *
 * Run:
 *   npx tsx examples/session-keys.ts
 */

import { AgenticWallet } from '@arbitrum/agentic-wallets';
import type { Address } from 'viem';

const PASSWORD = 'change-this-in-production-min-8-chars';
const WALLET_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678' as Address;

async function main() {
  const wallet = new AgenticWallet();
  const now = Math.floor(Date.now() / 1000);

  console.log('=== Session Key Management ===\n');

  // --- 1. Trading bot session ---
  // Restricted to a single DEX router, 0.1 ETH max per trade, 50 trades max, 1 hour
  console.log('1. Creating trading-bot session (1h, restricted to DEX router)');
  const tradingSession = await wallet.createSessionKey(
    WALLET_ADDRESS,
    {
      label: 'trading-bot',
      validAfter: now,
      validUntil: now + 3600,
      permissions: {
        allowedTargets: ['0xE592427A0AEce92De3Edee1F18E0157C05861564' as Address],
        maxValuePerTransaction: 100000000000000000n, // 0.1 ETH
        maxTransactions: 50,
      },
    },
    PASSWORD,
  );

  console.log(`   ID:      ${tradingSession.info.id}`);
  console.log(`   Address: ${tradingSession.info.sessionKeyAddress}`);
  console.log(`   Active:  ${tradingSession.info.isActive}`);
  console.log(`   Expires: ${new Date(tradingSession.info.validUntil * 1000).toISOString()}\n`);

  // --- 2. Data collector session ---
  // No value transfers allowed (read-only calls), 24 hours, 1000 ops max
  console.log('2. Creating data-collector session (24h, read-only)');
  const dataSession = await wallet.createSessionKey(
    WALLET_ADDRESS,
    {
      label: 'data-collector',
      validAfter: now,
      validUntil: now + 86400,
      permissions: {
        maxValuePerTransaction: 0n,
        maxTransactions: 1000,
      },
    },
    PASSWORD,
  );

  console.log(`   ID:      ${dataSession.info.id}`);
  console.log(`   Address: ${dataSession.info.sessionKeyAddress}`);
  console.log(`   Active:  ${dataSession.info.isActive}`);
  console.log(`   Expires: ${new Date(dataSession.info.validUntil * 1000).toISOString()}\n`);

  // --- 3. List all sessions ---
  console.log('3. All sessions:');
  const sessions = wallet.listSessions(WALLET_ADDRESS);
  for (const s of sessions) {
    const status = s.isRevoked ? 'REVOKED' : s.isActive ? 'ACTIVE' : 'EXPIRED';
    console.log(`   [${status}] ${s.label} — ${s.id}`);
  }
  console.log();

  // --- 4. Revoke the trading bot ---
  console.log(`4. Revoking trading-bot session: ${tradingSession.info.id}`);
  wallet.revokeSession(WALLET_ADDRESS, tradingSession.info.id);
  console.log('   Revoked.\n');

  // --- 5. Verify revocation ---
  console.log('5. Sessions after revocation:');
  const updated = wallet.listSessions(WALLET_ADDRESS);
  for (const s of updated) {
    const status = s.isRevoked ? 'REVOKED' : s.isActive ? 'ACTIVE' : 'EXPIRED';
    console.log(`   [${status}] ${s.label} — ${s.id}`);
  }
}

main().catch(console.error);

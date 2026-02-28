import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { type Address } from 'viem';
import { SessionManager } from './session-manager.js';
import { FileStorage } from '../utils/storage.js';

describe('SessionManager', () => {
  let tempDir: string;
  let storage: FileStorage;
  let manager: SessionManager;
  const walletAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as Address;
  const password = 'test-password-12345';

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'arb-wallet-test-'));
    storage = new FileStorage(tempDir);
    manager = new SessionManager(storage);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true });
  });

  it('should create a session key', async () => {
    const now = Math.floor(Date.now() / 1000);
    const session = await manager.createSessionKey(
      walletAddress,
      {
        label: 'test-session',
        validAfter: now,
        validUntil: now + 3600,
        permissions: {},
      },
      password,
    );

    expect(session.info.id).toBeDefined();
    expect(session.info.label).toBe('test-session');
    expect(session.info.sessionKeyAddress).toBeDefined();
    expect(session.info.isRevoked).toBe(false);
    expect(session.encryptedPrivateKey).toBeDefined();
  });

  it('should list sessions', async () => {
    const now = Math.floor(Date.now() / 1000);

    await manager.createSessionKey(
      walletAddress,
      { label: 'session-1', validAfter: now, validUntil: now + 3600, permissions: {} },
      password,
    );
    await manager.createSessionKey(
      walletAddress,
      { label: 'session-2', validAfter: now, validUntil: now + 7200, permissions: {} },
      password,
    );

    const sessions = manager.listSessions(walletAddress);
    expect(sessions).toHaveLength(2);
    expect(sessions.map((s) => s.label)).toContain('session-1');
    expect(sessions.map((s) => s.label)).toContain('session-2');
  });

  it('should revoke a session', async () => {
    const now = Math.floor(Date.now() / 1000);
    const session = await manager.createSessionKey(
      walletAddress,
      { label: 'to-revoke', validAfter: now, validUntil: now + 3600, permissions: {} },
      password,
    );

    const result = manager.revokeSession(walletAddress, session.info.id);
    expect(result).toBe(true);

    const sessions = manager.listSessions(walletAddress);
    const revoked = sessions.find((s) => s.id === session.info.id);
    expect(revoked?.isRevoked).toBe(true);
    expect(revoked?.isActive).toBe(false);
  });

  it('should decrypt session private key', async () => {
    const now = Math.floor(Date.now() / 1000);
    const session = await manager.createSessionKey(
      walletAddress,
      { label: 'decrypt-test', validAfter: now, validUntil: now + 3600, permissions: {} },
      password,
    );

    const privateKey = await manager.getSessionPrivateKey(walletAddress, session.info.id, password);
    expect(privateKey).toBeDefined();
    expect(privateKey.startsWith('0x')).toBe(true);
    expect(privateKey.length).toBe(66);
  });

  it('should throw when getting private key of revoked session', async () => {
    const now = Math.floor(Date.now() / 1000);
    const session = await manager.createSessionKey(
      walletAddress,
      { label: 'revoke-decrypt', validAfter: now, validUntil: now + 3600, permissions: {} },
      password,
    );

    manager.revokeSession(walletAddress, session.info.id);

    await expect(
      manager.getSessionPrivateKey(walletAddress, session.info.id, password),
    ).rejects.toThrow('revoked');
  });

  it('should throw on empty label', async () => {
    const now = Math.floor(Date.now() / 1000);
    await expect(
      manager.createSessionKey(
        walletAddress,
        { label: '', validAfter: now, validUntil: now + 3600, permissions: {} },
        password,
      ),
    ).rejects.toThrow('label is required');
  });

  it('should throw on invalid session times', async () => {
    const now = Math.floor(Date.now() / 1000);
    await expect(
      manager.createSessionKey(
        walletAddress,
        { label: 'bad-times', validAfter: now + 3600, validUntil: now, permissions: {} },
        password,
      ),
    ).rejects.toThrow('must be after validAfter');
  });

  it('should throw when revoking non-existent session', () => {
    expect(() => manager.revokeSession(walletAddress, 'nonexistent-id')).toThrow('not found');
  });
});

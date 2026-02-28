import { randomUUID } from 'node:crypto';
import { type Address, type Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import {
  type SessionKeyConfig,
  type SessionKeyInfo,
  type SessionKeyData,
} from '../types/session.js';
import { SessionKeyError } from '../types/errors.js';
import { FileStorage } from '../utils/storage.js';
import { encryptKey, decryptKey } from '../utils/crypto.js';
import { validateSessionTimes } from '../utils/validation.js';

const SESSION_COLLECTION = 'sessions';

export class SessionManager {
  private readonly storage: FileStorage;

  constructor(storage?: FileStorage) {
    this.storage = storage ?? new FileStorage();
  }

  async createSessionKey(
    walletAddress: Address,
    config: SessionKeyConfig,
    password: string,
  ): Promise<SessionKeyData> {
    validateSessionTimes(config.validAfter, config.validUntil);

    if (!config.label || config.label.trim().length === 0) {
      throw new SessionKeyError('Session key label is required');
    }

    const sessionPrivateKey = generatePrivateKey();
    const sessionAccount = privateKeyToAccount(sessionPrivateKey);
    const sessionId = randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const encryptedPrivateKey = encryptKey(sessionPrivateKey, password);

    const info: SessionKeyInfo = {
      id: sessionId,
      sessionKeyAddress: sessionAccount.address,
      label: config.label,
      validAfter: config.validAfter,
      validUntil: config.validUntil,
      permissions: config.permissions,
      isActive: config.validAfter <= now && config.validUntil > now,
      isRevoked: false,
      createdAt: now,
    };

    const sessionData: SessionKeyData = {
      info,
      encryptedPrivateKey: JSON.stringify(encryptedPrivateKey),
    };

    this.storage.save(
      `${SESSION_COLLECTION}/${walletAddress.toLowerCase()}`,
      sessionId,
      sessionData,
    );

    return sessionData;
  }

  listSessions(walletAddress: Address): SessionKeyInfo[] {
    const collection = `${SESSION_COLLECTION}/${walletAddress.toLowerCase()}`;
    const ids = this.storage.list(collection);
    const now = Math.floor(Date.now() / 1000);

    return ids
      .map((id) => {
        const data = this.storage.load<SessionKeyData>(collection, id);
        if (!data) return null;
        return {
          ...data.info,
          isActive:
            !data.info.isRevoked && data.info.validAfter <= now && data.info.validUntil > now,
        };
      })
      .filter((s): s is SessionKeyInfo => s !== null);
  }

  getSession(walletAddress: Address, sessionId: string): SessionKeyData | null {
    const collection = `${SESSION_COLLECTION}/${walletAddress.toLowerCase()}`;
    return this.storage.load<SessionKeyData>(collection, sessionId);
  }

  async getSessionPrivateKey(
    walletAddress: Address,
    sessionId: string,
    password: string,
  ): Promise<Hex> {
    const session = this.getSession(walletAddress, sessionId);
    if (!session) {
      throw new SessionKeyError(`Session key not found: ${sessionId}`);
    }

    if (session.info.isRevoked) {
      throw new SessionKeyError('Session key has been revoked');
    }

    const now = Math.floor(Date.now() / 1000);
    if (session.info.validUntil <= now) {
      throw new SessionKeyError('Session key has expired');
    }

    const encryptedData = JSON.parse(session.encryptedPrivateKey);
    return decryptKey(encryptedData, password);
  }

  revokeSession(walletAddress: Address, sessionId: string): boolean {
    const collection = `${SESSION_COLLECTION}/${walletAddress.toLowerCase()}`;
    const session = this.storage.load<SessionKeyData>(collection, sessionId);
    if (!session) {
      throw new SessionKeyError(`Session key not found: ${sessionId}`);
    }

    session.info.isRevoked = true;
    session.info.isActive = false;
    this.storage.save(collection, sessionId, session);
    return true;
  }
}

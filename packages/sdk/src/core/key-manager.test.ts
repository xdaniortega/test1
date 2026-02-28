import { describe, it, expect } from 'vitest';
import { KeyManager } from './key-manager.js';
import { isAddress, isHex } from 'viem';

describe('KeyManager', () => {
  const km = new KeyManager();
  const password = 'test-password-12345';

  describe('generatePrivateKey', () => {
    it('should generate a valid private key', () => {
      const key = km.generatePrivateKey();
      expect(isHex(key)).toBe(true);
      expect(key.length).toBe(66); // 0x + 64 hex chars
    });

    it('should generate unique keys', () => {
      const key1 = km.generatePrivateKey();
      const key2 = km.generatePrivateKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('getAddress', () => {
    it('should return a valid address from a private key', () => {
      const key = km.generatePrivateKey();
      const address = km.getAddress(key);
      expect(isAddress(address)).toBe(true);
    });

    it('should return deterministic addresses', () => {
      const key = km.generatePrivateKey();
      const addr1 = km.getAddress(key);
      const addr2 = km.getAddress(key);
      expect(addr1).toBe(addr2);
    });
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a private key', async () => {
      const key = km.generatePrivateKey();
      const encrypted = await km.encryptPrivateKey(key, password);
      const decrypted = await km.decryptPrivateKey(encrypted, password);
      expect(decrypted).toBe(key);
    });

    it('should reject invalid private keys', async () => {
      await expect(km.encryptPrivateKey('0x123' as `0x${string}`, password)).rejects.toThrow(
        'Invalid private key',
      );
    });

    it('should reject short passwords', async () => {
      const key = km.generatePrivateKey();
      await expect(km.encryptPrivateKey(key, 'short')).rejects.toThrow('at least 8 characters');
    });
  });
});

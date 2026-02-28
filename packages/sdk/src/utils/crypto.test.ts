import { describe, it, expect } from 'vitest';
import { encryptKey, decryptKey } from './crypto.js';
import { type Hex } from 'viem';

describe('crypto', () => {
  const testKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as Hex;
  const password = 'test-password-12345';

  describe('encryptKey', () => {
    it('should encrypt a private key', () => {
      const encrypted = encryptKey(testKey, password);

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.kdf).toBe('scrypt');
      expect(encrypted.kdfParams.n).toBeGreaterThan(0);
      expect(encrypted.kdfParams.r).toBeGreaterThan(0);
      expect(encrypted.kdfParams.p).toBeGreaterThan(0);
      expect(encrypted.kdfParams.dkLen).toBe(32);
    });

    it('should produce different ciphertexts for the same key', () => {
      const encrypted1 = encryptKey(testKey, password);
      const encrypted2 = encryptKey(testKey, password);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should throw on short password', () => {
      expect(() => encryptKey(testKey, 'short')).toThrow('Password must be at least 8 characters');
    });

    it('should throw on empty password', () => {
      expect(() => encryptKey(testKey, '')).toThrow('Password must be at least 8 characters');
    });
  });

  describe('decryptKey', () => {
    it('should decrypt an encrypted key', () => {
      const encrypted = encryptKey(testKey, password);
      const decrypted = decryptKey(encrypted, password);

      expect(decrypted).toBe(testKey);
    });

    it('should throw on wrong password', () => {
      const encrypted = encryptKey(testKey, password);

      expect(() => decryptKey(encrypted, 'wrong-password-1234')).toThrow(
        'Failed to decrypt private key',
      );
    });
  });
});

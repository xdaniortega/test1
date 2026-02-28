import { describe, it, expect } from 'vitest';
import {
  validateNetwork,
  validateProvider,
  validateAddress,
  validatePrivateKey,
  validatePassword,
  validateSessionTimes,
} from './validation.js';

describe('validation', () => {
  describe('validateNetwork', () => {
    it('should accept arbitrum-one', () => {
      expect(() => validateNetwork('arbitrum-one')).not.toThrow();
    });

    it('should accept arbitrum-sepolia', () => {
      expect(() => validateNetwork('arbitrum-sepolia')).not.toThrow();
    });

    it('should reject unsupported networks', () => {
      expect(() => validateNetwork('ethereum')).toThrow('Unsupported network');
      expect(() => validateNetwork('polygon')).toThrow('Unsupported network');
    });
  });

  describe('validateProvider', () => {
    it('should accept alchemy', () => {
      expect(() => validateProvider('alchemy')).not.toThrow();
    });

    it('should accept zerodev', () => {
      expect(() => validateProvider('zerodev')).not.toThrow();
    });

    it('should accept ambire', () => {
      expect(() => validateProvider('ambire')).not.toThrow();
    });

    it('should reject unsupported providers', () => {
      expect(() => validateProvider('pimlico')).toThrow('Unsupported provider');
    });
  });

  describe('validateAddress', () => {
    it('should accept valid addresses', () => {
      expect(() => validateAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).not.toThrow();
    });

    it('should reject invalid addresses', () => {
      expect(() => validateAddress('not-an-address')).toThrow('not a valid Ethereum address');
      expect(() => validateAddress('0x123')).toThrow('not a valid Ethereum address');
    });
  });

  describe('validatePrivateKey', () => {
    it('should accept valid private keys', () => {
      expect(() =>
        validatePrivateKey('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'),
      ).not.toThrow();
    });

    it('should reject invalid private keys', () => {
      expect(() => validatePrivateKey('0x123')).toThrow('Invalid private key format');
      expect(() => validatePrivateKey('not-hex')).toThrow('Invalid private key format');
    });
  });

  describe('validatePassword', () => {
    it('should accept passwords >= 8 chars', () => {
      expect(() => validatePassword('12345678')).not.toThrow();
    });

    it('should reject short passwords', () => {
      expect(() => validatePassword('short')).toThrow('at least 8 characters');
      expect(() => validatePassword('')).toThrow('at least 8 characters');
    });
  });

  describe('validateSessionTimes', () => {
    it('should accept valid session times', () => {
      const now = Math.floor(Date.now() / 1000);
      expect(() => validateSessionTimes(now, now + 3600)).not.toThrow();
    });

    it('should reject validUntil <= validAfter', () => {
      const now = Math.floor(Date.now() / 1000);
      expect(() => validateSessionTimes(now + 100, now)).toThrow('must be after validAfter');
    });

    it('should reject expired sessions', () => {
      expect(() => validateSessionTimes(100, 200)).toThrow('must be in the future');
    });
  });
});

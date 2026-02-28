import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from 'node:crypto';
import { type Hex } from 'viem';
import { type EncryptedKeyData } from '../types/keystore.js';
import { KeyManagementError } from '../types/errors.js';

const ALGORITHM = 'aes-256-gcm';
const SCRYPT_N = 2 ** 18;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;

function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
}

export function encryptKey(privateKey: Hex, password: string): EncryptedKeyData {
  if (!password || password.length < 8) {
    throw new KeyManagementError('Password must be at least 8 characters');
  }

  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const keyBytes = Buffer.from(privateKey.slice(2), 'hex');
  const encrypted = Buffer.concat([cipher.update(keyBytes), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    authTag: authTag.toString('base64'),
    kdf: 'scrypt',
    kdfParams: {
      n: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      dkLen: KEY_LENGTH,
    },
  };
}

export function decryptKey(encryptedData: EncryptedKeyData, password: string): Hex {
  try {
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');

    const key = scryptSync(password, salt, encryptedData.kdfParams.dkLen, {
      N: encryptedData.kdfParams.n,
      r: encryptedData.kdfParams.r,
      p: encryptedData.kdfParams.p,
    });

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return `0x${decrypted.toString('hex')}` as Hex;
  } catch (error) {
    if (error instanceof KeyManagementError) throw error;
    throw new KeyManagementError('Failed to decrypt private key. Wrong password?');
  }
}

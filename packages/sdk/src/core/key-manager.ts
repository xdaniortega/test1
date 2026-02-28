import { generatePrivateKey as viemGeneratePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { type Address, type Hex } from 'viem';
import { type EncryptedKeyData, type KeyStore } from '../types/keystore.js';
import { encryptKey, decryptKey } from '../utils/crypto.js';
import { validatePrivateKey, validatePassword } from '../utils/validation.js';

export class KeyManager implements KeyStore {
  generatePrivateKey(): Hex {
    return viemGeneratePrivateKey();
  }

  async encryptPrivateKey(privateKey: Hex, password: string): Promise<EncryptedKeyData> {
    validatePrivateKey(privateKey);
    validatePassword(password);
    return encryptKey(privateKey, password);
  }

  async decryptPrivateKey(encryptedData: EncryptedKeyData, password: string): Promise<Hex> {
    return decryptKey(encryptedData, password);
  }

  getAddress(privateKey: Hex): Address {
    validatePrivateKey(privateKey);
    const account = privateKeyToAccount(privateKey);
    return account.address;
  }
}

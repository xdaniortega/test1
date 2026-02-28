import { type Address, type Hex } from 'viem';

export interface EncryptedKeyData {
  /** Encrypted private key (base64) */
  ciphertext: string;
  /** Initialization vector (base64) */
  iv: string;
  /** Salt used for key derivation (base64) */
  salt: string;
  /** Authentication tag (base64) */
  authTag: string;
  /** Key derivation function used */
  kdf: 'scrypt';
  /** KDF parameters */
  kdfParams: {
    n: number;
    r: number;
    p: number;
    dkLen: number;
  };
}

export interface StoredWallet {
  /** Wallet identifier */
  id: string;
  /** Smart account address */
  address: Address;
  /** Owner EOA address */
  ownerAddress: Address;
  /** Encrypted owner private key */
  encryptedKey: EncryptedKeyData;
  /** Network */
  network: string;
  /** Provider */
  provider: string;
  /** Creation timestamp */
  createdAt: number;
}

export interface KeyStore {
  /** Generate a new random private key */
  generatePrivateKey(): Hex;

  /** Encrypt a private key with a password */
  encryptPrivateKey(privateKey: Hex, password: string): Promise<EncryptedKeyData>;

  /** Decrypt a private key with a password */
  decryptPrivateKey(encryptedData: EncryptedKeyData, password: string): Promise<Hex>;

  /** Get the public address from a private key */
  getAddress(privateKey: Hex): Address;
}

import { type Address, type Hex, formatEther } from 'viem';
import {
  type WalletConfig,
  type WalletInfo,
  type WalletBalance,
  type SendTransactionOptions,
  type TransactionResult,
} from '../types/wallet.js';
import { type BundlerProvider } from '../types/provider.js';
import {
  type SessionKeyConfig,
  type SessionKeyInfo,
  type SessionKeyData,
} from '../types/session.js';
import { type StoredWallet } from '../types/keystore.js';
import { getChain, type SupportedNetwork } from '../types/chain.js';
import { AgenticWalletError } from '../types/errors.js';
import { KeyManager } from './key-manager.js';
import { SessionManager } from './session-manager.js';
import { createProvider } from '../providers/index.js';
import { FileStorage } from '../utils/storage.js';
import { validateNetwork, validateProvider } from '../utils/validation.js';

const WALLET_COLLECTION = 'wallets';

export class AgenticWallet {
  private readonly keyManager: KeyManager;
  private readonly sessionManager: SessionManager;
  private readonly storage: FileStorage;
  private provider: BundlerProvider | null = null;
  private config: WalletConfig | null = null;

  constructor(storageDir?: string) {
    this.storage = new FileStorage(storageDir);
    this.keyManager = new KeyManager();
    this.sessionManager = new SessionManager(this.storage);
  }

  async initialize(config: WalletConfig): Promise<void> {
    validateNetwork(config.network);
    validateProvider(config.provider);

    this.config = config;
    this.provider = createProvider(config.provider);
    const chain = getChain(config.network);
    await this.provider.initialize(chain, config.apiKey);
  }

  async createWallet(password: string): Promise<WalletInfo> {
    this.ensureInitialized();

    const privateKey = this.keyManager.generatePrivateKey();
    const ownerAddress = this.keyManager.getAddress(privateKey);
    const encryptedKey = await this.keyManager.encryptPrivateKey(privateKey, password);
    const smartAccountAddress = await this.provider!.getSmartAccountAddress(
      privateKey,
      this.config!.salt,
    );

    const walletId = ownerAddress.toLowerCase();
    const storedWallet: StoredWallet = {
      id: walletId,
      address: smartAccountAddress,
      ownerAddress,
      encryptedKey,
      network: this.config!.network,
      provider: this.config!.provider,
      createdAt: Math.floor(Date.now() / 1000),
    };

    this.storage.save(WALLET_COLLECTION, walletId, storedWallet);

    return {
      address: smartAccountAddress,
      isDeployed: false,
      ownerAddress,
      network: this.config!.network,
      provider: this.config!.provider,
    };
  }

  async importWallet(privateKey: Hex, password: string): Promise<WalletInfo> {
    this.ensureInitialized();

    const ownerAddress = this.keyManager.getAddress(privateKey);
    const encryptedKey = await this.keyManager.encryptPrivateKey(privateKey, password);
    const smartAccountAddress = await this.provider!.getSmartAccountAddress(
      privateKey,
      this.config!.salt,
    );

    const walletId = ownerAddress.toLowerCase();
    const storedWallet: StoredWallet = {
      id: walletId,
      address: smartAccountAddress,
      ownerAddress,
      encryptedKey,
      network: this.config!.network,
      provider: this.config!.provider,
      createdAt: Math.floor(Date.now() / 1000),
    };

    this.storage.save(WALLET_COLLECTION, walletId, storedWallet);

    return {
      address: smartAccountAddress,
      isDeployed: await this.provider!.isAccountDeployed(smartAccountAddress),
      ownerAddress,
      network: this.config!.network,
      provider: this.config!.provider,
    };
  }

  async getWalletInfo(walletId: string): Promise<WalletInfo | null> {
    const stored = this.storage.load<StoredWallet>(WALLET_COLLECTION, walletId);
    if (!stored) return null;

    const isDeployed = this.provider
      ? await this.provider.isAccountDeployed(stored.address)
      : false;

    return {
      address: stored.address,
      isDeployed,
      ownerAddress: stored.ownerAddress,
      network: stored.network as SupportedNetwork,
      provider: stored.provider as WalletConfig['provider'],
    };
  }

  listWallets(): string[] {
    return this.storage.list(WALLET_COLLECTION);
  }

  async getBalance(address: Address): Promise<WalletBalance> {
    this.ensureInitialized();
    const balance = await this.provider!.getBalance(address);
    return {
      address,
      balance,
      formatted: formatEther(balance),
      symbol: 'ETH',
    };
  }

  async sendTransaction(
    walletId: string,
    password: string,
    options: SendTransactionOptions,
  ): Promise<TransactionResult> {
    this.ensureInitialized();

    const stored = this.storage.load<StoredWallet>(WALLET_COLLECTION, walletId);
    if (!stored) {
      throw new AgenticWalletError(`Wallet not found: ${walletId}`, 'WALLET_NOT_FOUND');
    }

    const privateKey = await this.keyManager.decryptPrivateKey(stored.encryptedKey, password);

    if (options.dryRun) {
      await this.provider!.estimateUserOperationGas(privateKey, options.calls);
      return {
        userOpHash: '0x' as `0x${string}`,
        success: true,
      };
    }

    return this.provider!.sendUserOperation(privateKey, options.calls, {
      sponsorGas: options.sponsorGas,
    });
  }

  // Session key management delegated methods
  async createSessionKey(
    walletAddress: Address,
    config: SessionKeyConfig,
    password: string,
  ): Promise<SessionKeyData> {
    return this.sessionManager.createSessionKey(walletAddress, config, password);
  }

  listSessions(walletAddress: Address): SessionKeyInfo[] {
    return this.sessionManager.listSessions(walletAddress);
  }

  revokeSession(walletAddress: Address, sessionId: string): boolean {
    return this.sessionManager.revokeSession(walletAddress, sessionId);
  }

  private ensureInitialized(): void {
    if (!this.provider || !this.config) {
      throw new AgenticWalletError(
        'Wallet not initialized. Call initialize() first.',
        'NOT_INITIALIZED',
      );
    }
  }
}

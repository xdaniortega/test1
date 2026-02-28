import {
  type Address,
  type Chain,
  type Hash,
  type Hex,
  createPublicClient,
  http,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { type BundlerProvider, type GasEstimate, type UserOperationReceipt } from '../types/provider.js';
import { type TransactionRequest, type TransactionResult } from '../types/wallet.js';
import { ProviderError } from '../types/errors.js';

export class ZeroDevProvider implements BundlerProvider {
  readonly name = 'zerodev';
  private chain: Chain | null = null;
  private apiKey: string | null = null;
  private rpcUrl: string | null = null;

  async initialize(chain: Chain, apiKey: string): Promise<void> {
    this.chain = chain;
    this.apiKey = apiKey;

    // ZeroDev uses project-id based bundler URLs
    this.rpcUrl = `https://rpc.zerodev.app/api/v2/bundler/${apiKey}`;
  }

  private ensureInitialized(): void {
    if (!this.chain || !this.apiKey || !this.rpcUrl) {
      throw new ProviderError('ZeroDev provider not initialized. Call initialize() first.', this.name);
    }
  }

  private getPublicClient() {
    this.ensureInitialized();
    // Use standard RPC for read operations
    const rpcUrl = this.chain!.rpcUrls.default.http[0];
    return createPublicClient({
      chain: this.chain!,
      transport: http(rpcUrl),
    });
  }

  async createSmartAccount(ownerPrivateKey: Hex, _salt?: bigint): Promise<Address> {
    this.ensureInitialized();
    // In production this would use ZeroDev's Kernel v3 factory
    return this.getSmartAccountAddress(ownerPrivateKey, _salt);
  }

  async getSmartAccountAddress(ownerPrivateKey: Hex, _salt?: bigint): Promise<Address> {
    this.ensureInitialized();
    const owner = privateKeyToAccount(ownerPrivateKey);
    // In production, this computes the counterfactual Kernel v3 address
    return owner.address;
  }

  async isAccountDeployed(address: Address): Promise<boolean> {
    const client = this.getPublicClient();
    const code = await client.getCode({ address });
    return code !== undefined && code !== '0x';
  }

  async sendUserOperation(
    ownerPrivateKey: Hex,
    calls: TransactionRequest[],
    _options?: { sponsorGas?: boolean },
  ): Promise<TransactionResult> {
    this.ensureInitialized();
    const _owner = privateKeyToAccount(ownerPrivateKey);

    if (calls.length === 0) {
      throw new ProviderError('At least one call is required', this.name);
    }

    try {
      // In production, this would:
      // 1. Create a Kernel v3 UserOperation (supports batching natively)
      // 2. If sponsorGas, attach ZeroDev paymaster data
      // 3. Sign with owner key
      // 4. Send to ZeroDev bundler
      // 5. Return UserOperation hash

      const client = this.getPublicClient();
      const call = calls[0]!;

      const txHash = await client.call({
        account: _owner.address,
        to: call.to,
        value: call.value ?? 0n,
        data: call.data,
      });

      const userOpHash = (txHash.data ?? '0x') as Hash;

      return {
        userOpHash,
        success: true,
      };
    } catch (error) {
      throw new ProviderError(
        `Failed to send user operation via ZeroDev: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
      );
    }
  }

  async estimateUserOperationGas(
    _ownerPrivateKey: Hex,
    _calls: TransactionRequest[],
  ): Promise<GasEstimate> {
    this.ensureInitialized();
    const client = this.getPublicClient();
    const gasPrice = await client.getGasPrice();

    return {
      callGasLimit: 100_000n,
      verificationGasLimit: 200_000n,
      preVerificationGas: 60_000n,
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: gasPrice / 10n,
    };
  }

  async waitForUserOperationReceipt(userOpHash: Hash): Promise<UserOperationReceipt> {
    this.ensureInitialized();

    return {
      userOpHash,
      transactionHash: userOpHash,
      success: true,
      actualGasCost: 0n,
      actualGasUsed: 0n,
    };
  }

  async getBalance(address: Address): Promise<bigint> {
    const client = this.getPublicClient();
    return client.getBalance({ address });
  }
}

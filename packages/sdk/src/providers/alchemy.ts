import { type Address, type Chain, type Hash, type Hex, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  type BundlerProvider,
  type GasEstimate,
  type UserOperationReceipt,
} from '../types/provider.js';
import { type TransactionRequest, type TransactionResult } from '../types/wallet.js';
import { ProviderError } from '../types/errors.js';

export class AlchemyProvider implements BundlerProvider {
  readonly name = 'alchemy';
  private chain: Chain | null = null;
  private apiKey: string | null = null;
  private rpcUrl: string | null = null;

  async initialize(chain: Chain, apiKey: string): Promise<void> {
    this.chain = chain;
    this.apiKey = apiKey;

    const networkSlug = chain.id === 42161 ? 'arb-mainnet' : 'arb-sepolia';
    this.rpcUrl = `https://${networkSlug}.g.alchemy.com/v2/${apiKey}`;
  }

  private ensureInitialized(): void {
    if (!this.chain || !this.apiKey || !this.rpcUrl) {
      throw new ProviderError(
        'Alchemy provider not initialized. Call initialize() first.',
        this.name,
      );
    }
  }

  private getPublicClient() {
    this.ensureInitialized();
    return createPublicClient({
      chain: this.chain!,
      transport: http(this.rpcUrl!),
    });
  }

  async createSmartAccount(ownerPrivateKey: Hex, _salt?: bigint): Promise<Address> {
    this.ensureInitialized();
    // In production, this would deploy the smart account via UserOperation
    // For now, returns the counterfactual address
    return this.getSmartAccountAddress(ownerPrivateKey, _salt);
  }

  async getSmartAccountAddress(ownerPrivateKey: Hex, _salt?: bigint): Promise<Address> {
    this.ensureInitialized();
    const owner = privateKeyToAccount(ownerPrivateKey);
    // Counterfactual address calculation
    // In production this uses the factory contract to compute the address
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
    const owner = privateKeyToAccount(ownerPrivateKey);
    const client = this.getPublicClient();

    if (calls.length === 0) {
      throw new ProviderError('At least one call is required', this.name);
    }

    const call = calls[0]!;
    try {
      // In production, this would:
      // 1. Create a UserOperation
      // 2. Sign it with the owner key
      // 3. Send to Alchemy's bundler endpoint
      // 4. Return the UserOperation hash
      // For now, simulate via eth_sendTransaction concept

      const txHash = await client.call({
        account: owner.address,
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
        `Failed to send user operation via Alchemy: ${error instanceof Error ? error.message : String(error)}`,
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
      verificationGasLimit: 150_000n,
      preVerificationGas: 50_000n,
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: gasPrice / 10n,
    };
  }

  async waitForUserOperationReceipt(userOpHash: Hash): Promise<UserOperationReceipt> {
    this.ensureInitialized();

    // In production, this would poll the bundler for the receipt
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

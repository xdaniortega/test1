import { type Address, type Hash, type Hex, type Chain } from 'viem';
import { type TransactionRequest, type TransactionResult } from './wallet.js';

export interface UserOperationRequest {
  /** Sender smart account address */
  sender: Address;
  /** Nonce */
  nonce: bigint;
  /** Init code for account deployment (empty if already deployed) */
  initCode: Hex;
  /** Encoded call data */
  callData: Hex;
  /** Gas limits */
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  /** Gas prices */
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  /** Paymaster data (empty if self-paying) */
  paymasterAndData: Hex;
  /** Signature */
  signature: Hex;
}

export interface GasEstimate {
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface UserOperationReceipt {
  userOpHash: Hash;
  transactionHash: Hash;
  success: boolean;
  reason?: string;
  actualGasCost: bigint;
  actualGasUsed: bigint;
}

/**
 * Abstract interface for bundler/paymaster providers.
 * Implementations handle the specifics of Alchemy, ZeroDev, Pimlico, etc.
 */
export interface BundlerProvider {
  /** Provider name identifier */
  readonly name: string;

  /** Initialize the provider with chain and API key */
  initialize(chain: Chain, apiKey: string): Promise<void>;

  /** Create a smart account and return its address */
  createSmartAccount(ownerPrivateKey: Hex, salt?: bigint): Promise<Address>;

  /** Get the counterfactual address without deploying */
  getSmartAccountAddress(ownerPrivateKey: Hex, salt?: bigint): Promise<Address>;

  /** Check if the smart account is deployed */
  isAccountDeployed(address: Address): Promise<boolean>;

  /** Send a user operation through the bundler */
  sendUserOperation(
    ownerPrivateKey: Hex,
    calls: TransactionRequest[],
    options?: { sponsorGas?: boolean },
  ): Promise<TransactionResult>;

  /** Estimate gas for a user operation */
  estimateUserOperationGas(
    ownerPrivateKey: Hex,
    calls: TransactionRequest[],
  ): Promise<GasEstimate>;

  /** Wait for a user operation receipt */
  waitForUserOperationReceipt(userOpHash: Hash): Promise<UserOperationReceipt>;

  /** Get the native balance of an address */
  getBalance(address: Address): Promise<bigint>;
}

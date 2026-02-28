import { type Address, type Hash, type Hex } from 'viem';
import { type SupportedNetwork } from './chain.js';

export interface WalletConfig {
  /** Network to deploy the wallet on */
  network: SupportedNetwork;
  /** Provider to use for bundling and paymaster */
  provider: ProviderType;
  /** API key for the provider */
  apiKey: string;
  /** Optional salt for deterministic address generation */
  salt?: bigint;
}

export type ProviderType = 'alchemy' | 'zerodev';

export interface WalletInfo {
  /** Smart account address (counterfactual or deployed) */
  address: Address;
  /** Whether the account has been deployed on-chain */
  isDeployed: boolean;
  /** The owner EOA address */
  ownerAddress: Address;
  /** Network the wallet is on */
  network: SupportedNetwork;
  /** Provider being used */
  provider: ProviderType;
}

export interface WalletBalance {
  /** Address of the wallet */
  address: Address;
  /** Native ETH balance in wei */
  balance: bigint;
  /** Human-readable balance string */
  formatted: string;
  /** Token symbol */
  symbol: string;
}

export interface TransactionRequest {
  /** Target contract address */
  to: Address;
  /** Value in wei to send */
  value?: bigint;
  /** Encoded calldata */
  data?: Hex;
}

export interface TransactionResult {
  /** UserOperation hash */
  userOpHash: Hash;
  /** Transaction hash (after inclusion) */
  transactionHash?: Hash;
  /** Whether the operation was successful */
  success: boolean;
}

export interface SendTransactionOptions {
  /** Transaction(s) to execute (supports batching) */
  calls: TransactionRequest[];
  /** Whether to sponsor gas via paymaster */
  sponsorGas?: boolean;
  /** If true, only simulate without sending */
  dryRun?: boolean;
}

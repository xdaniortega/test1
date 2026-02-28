export { SUPPORTED_CHAINS, getChain, isSupportedNetwork } from './chain.js';
export type { SupportedNetwork } from './chain.js';

export type {
  WalletConfig,
  ProviderType,
  WalletInfo,
  WalletBalance,
  TransactionRequest,
  TransactionResult,
  SendTransactionOptions,
} from './wallet.js';

export type {
  SessionKeyPermissions,
  SessionKeyConfig,
  SessionKeyInfo,
  SessionKeyData,
} from './session.js';

export type {
  UserOperationRequest,
  GasEstimate,
  UserOperationReceipt,
  BundlerProvider,
} from './provider.js';

export type { EncryptedKeyData, StoredWallet, KeyStore } from './keystore.js';

export {
  AgenticWalletError,
  InvalidNetworkError,
  InvalidProviderError,
  KeyManagementError,
  SessionKeyError,
  TransactionError,
  ProviderError,
} from './errors.js';

export class AgenticWalletError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AgenticWalletError';
  }
}

export class InvalidNetworkError extends AgenticWalletError {
  constructor(network: string) {
    super(
      `Unsupported network: "${network}". Supported networks: arbitrum-one, arbitrum-sepolia`,
      'INVALID_NETWORK',
    );
    this.name = 'InvalidNetworkError';
  }
}

export class InvalidProviderError extends AgenticWalletError {
  constructor(provider: string) {
    super(
      `Unsupported provider: "${provider}". Supported providers: alchemy, zerodev`,
      'INVALID_PROVIDER',
    );
    this.name = 'InvalidProviderError';
  }
}

export class KeyManagementError extends AgenticWalletError {
  constructor(message: string) {
    super(message, 'KEY_MANAGEMENT_ERROR');
    this.name = 'KeyManagementError';
  }
}

export class SessionKeyError extends AgenticWalletError {
  constructor(message: string) {
    super(message, 'SESSION_KEY_ERROR');
    this.name = 'SessionKeyError';
  }
}

export class TransactionError extends AgenticWalletError {
  constructor(message: string) {
    super(message, 'TRANSACTION_ERROR');
    this.name = 'TransactionError';
  }
}

export class ProviderError extends AgenticWalletError {
  constructor(
    message: string,
    public readonly provider: string,
  ) {
    super(message, 'PROVIDER_ERROR');
    this.name = 'ProviderError';
  }
}

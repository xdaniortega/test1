import { isAddress, isHex } from 'viem';
import { type SupportedNetwork, isSupportedNetwork } from '../types/chain.js';
import { type ProviderType } from '../types/wallet.js';
import { InvalidNetworkError, InvalidProviderError, AgenticWalletError } from '../types/errors.js';

const VALID_PROVIDERS: ProviderType[] = ['alchemy', 'zerodev'];

export function validateNetwork(network: string): asserts network is SupportedNetwork {
  if (!isSupportedNetwork(network)) {
    throw new InvalidNetworkError(network);
  }
}

export function validateProvider(provider: string): asserts provider is ProviderType {
  if (!VALID_PROVIDERS.includes(provider as ProviderType)) {
    throw new InvalidProviderError(provider);
  }
}

export function validateAddress(address: string, label = 'Address'): void {
  if (!isAddress(address)) {
    throw new AgenticWalletError(`${label} is not a valid Ethereum address: ${address}`, 'INVALID_ADDRESS');
  }
}

export function validateHex(value: string, label = 'Value'): void {
  if (!isHex(value)) {
    throw new AgenticWalletError(`${label} is not valid hex: ${value}`, 'INVALID_HEX');
  }
}

export function validatePrivateKey(key: string): void {
  if (!isHex(key) || key.length !== 66) {
    throw new AgenticWalletError(
      'Invalid private key format. Must be a 32-byte hex string with 0x prefix.',
      'INVALID_PRIVATE_KEY',
    );
  }
}

export function validatePassword(password: string): void {
  if (!password || password.length < 8) {
    throw new AgenticWalletError(
      'Password must be at least 8 characters long.',
      'INVALID_PASSWORD',
    );
  }
}

export function validateSessionTimes(validAfter: number, validUntil: number): void {
  const now = Math.floor(Date.now() / 1000);
  if (validUntil <= validAfter) {
    throw new AgenticWalletError(
      'Session validUntil must be after validAfter.',
      'INVALID_SESSION_TIMES',
    );
  }
  if (validUntil <= now) {
    throw new AgenticWalletError(
      'Session validUntil must be in the future.',
      'INVALID_SESSION_TIMES',
    );
  }
}

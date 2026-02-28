import { type BundlerProvider } from '../types/provider.js';
import { type ProviderType } from '../types/wallet.js';
import { InvalidProviderError } from '../types/errors.js';
import { AlchemyProvider } from './alchemy.js';
import { ZeroDevProvider } from './zerodev.js';

export function createProvider(type: ProviderType): BundlerProvider {
  switch (type) {
    case 'alchemy':
      return new AlchemyProvider();
    case 'zerodev':
      return new ZeroDevProvider();
    default:
      throw new InvalidProviderError(type as string);
  }
}

export { AlchemyProvider } from './alchemy.js';
export { ZeroDevProvider } from './zerodev.js';

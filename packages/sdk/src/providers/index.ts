import { type BundlerProvider } from '../types/provider.js';
import { type ProviderType } from '../types/wallet.js';
import { InvalidProviderError } from '../types/errors.js';
import { AlchemyProvider } from './alchemy.js';
import { ZeroDevProvider } from './zerodev.js';
import { AmbireProvider } from './ambire.js';

export function createProvider(type: ProviderType): BundlerProvider {
  switch (type) {
    case 'alchemy':
      return new AlchemyProvider();
    case 'zerodev':
      return new ZeroDevProvider();
    case 'ambire':
      return new AmbireProvider();
    default:
      throw new InvalidProviderError(type as string);
  }
}

export { AlchemyProvider } from './alchemy.js';
export { ZeroDevProvider } from './zerodev.js';
export { AmbireProvider } from './ambire.js';

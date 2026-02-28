import { type Chain } from 'viem';
import { arbitrum, arbitrumSepolia } from 'viem/chains';

export const SUPPORTED_CHAINS = {
  'arbitrum-one': arbitrum,
  'arbitrum-sepolia': arbitrumSepolia,
} as const;

export type SupportedNetwork = keyof typeof SUPPORTED_CHAINS;

export function getChain(network: SupportedNetwork): Chain {
  return SUPPORTED_CHAINS[network];
}

export function isSupportedNetwork(network: string): network is SupportedNetwork {
  return network in SUPPORTED_CHAINS;
}

/**
 * Core types for the wallet layer.
 *
 * Keeping these plain — no classes, no inheritance — because the wallet
 * module is a thin wrapper over @scure/bip39 and @scure/bip32. Everything
 * is pure functions on strings and numbers.
 */

export type ChainId = 'ethereum' | 'bsc' | 'polygon' | 'arbitrum' | 'optimism' | 'base';

/**
 * Metadata for each supported chain. RPC URLs are public endpoints — no
 * API key needed. Some of these fall over regularly, same as the ones in
 * chainlens. Might add fallback later.
 */
export interface ChainConfig {
  readonly id: ChainId;
  readonly name: string;
  readonly chainId: number;
  readonly rpcUrl: string;
  readonly explorerUrl: string;
  readonly nativeSymbol: string;
}

export const CHAINS: Readonly<Record<ChainId, ChainConfig>> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://ethereum.publicnode.com',
    explorerUrl: 'https://etherscan.io',
    nativeSymbol: 'ETH',
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Chain',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    nativeSymbol: 'BNB',
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeSymbol: 'MATIC',
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeSymbol: 'ETH',
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeSymbol: 'ETH',
  },
  base: {
    id: 'base',
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    nativeSymbol: 'ETH',
  },
};

/**
 * A derived address pair (private key + public address).
 *
 * The private key is a hex string with 0x prefix. Do NOT log this.
 */
export interface DerivedAccount {
  readonly index: number;
  readonly address: string;
  readonly privateKey: string;
}

export interface BalanceResult {
  readonly chain: ChainId;
  readonly address: string;
  readonly balanceWei: bigint;
  readonly balanceFormatted: string;
}
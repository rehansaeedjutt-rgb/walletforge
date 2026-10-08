/**
 * Multi-chain balance provider.
 *
 * Uses ethers JsonRpcProvider for each chain. Public RPC endpoints are
 * fine for read-only queries but get rate-limited fast if you hit them
 * in a loop. If this ever gets used in production, swap to a private
 * endpoint per chain.
 */

import { JsonRpcProvider, formatEther } from 'ethers';
import type { BalanceResult, ChainId } from '../wallet/types.js';
import { CHAINS } from '../wallet/types.js';

// Cache providers so we do not reconnect on every call.
const providerCache = new Map<ChainId, JsonRpcProvider>();

function getProvider(chain: ChainId): JsonRpcProvider {
  const cached = providerCache.get(chain);
  if (cached) return cached;

  const config = CHAINS[chain];
  const provider = new JsonRpcProvider(config.rpcUrl, {
    chainId: config.chainId,
    name: chain,
  });
  providerCache.set(chain, provider);
  return provider;
}

/**
 * Get native balance on a single chain.
 */
export async function getBalance(chain: ChainId, address: string): Promise<BalanceResult> {
  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error(`Invalid EVM address: ${address}`);
  }

  const provider = getProvider(chain);
  const balanceWei = await provider.getBalance(address);

  return {
    chain,
    address,
    balanceWei,
    balanceFormatted: formatEther(balanceWei),
  };
}

/**
 * Get native balances across multiple chains in parallel.
 *
 * If one chain fails, we return the results from the rest and log the
 * failure. Failing the whole call because polygon is down would be
 * annoying.
 */
export async function getBalancesMultiChain(
  chains: ChainId[],
  address: string,
): Promise<BalanceResult[]> {
  const results = await Promise.allSettled(
    chains.map((chain) => getBalance(chain, address)),
  );

  const out: BalanceResult[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result && result.status === 'fulfilled') {
      out.push(result.value);
    } else {
      const chain = chains[i];
      console.warn(`  ! ${chain} failed:`, result && 'reason' in result ? result.reason : 'unknown');
    }
  }
  return out;
}

/**
 * Clear the provider cache. Mainly for tests so a mock can be injected.
 */
export function _clearProviderCache(): void {
  providerCache.clear();
}
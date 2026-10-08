/**
 * HD wallet derivation.
 *
 * Given a mnemonic phrase, derive accounts at the standard BIP-44 path:
 *   m / 44' / 60' / 0' / 0 / <index>
 *
 * 60 is the coin type for Ethereum and all EVM chains. 0 is the first
 * account. index is the address position (0, 1, 2, ...).
 *
 * @scure/bip39 and @scure/bip32 are used instead of ethers' built-in
 * HDNodeWallet because they expose the underlying seed directly, which
 * makes it easier to derive across chains later.
 */

import { mnemonicToSeedSync, generateMnemonic as genMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { computeAddress } from 'ethers';
import type { DerivedAccount } from './types.js';

// BIP-44 constants for EVM chains.
const PURPOSE = 44;
const COIN_TYPE_ETH = 60;
const ACCOUNT_INDEX = 0;

/**
 * Generate a fresh 12-word mnemonic.
 *
 * 128 bits of entropy. 24-word (256 bit) is also valid but 12 is enough
 * for normal use. Real users should write it down and never type it
 * anywhere online.
 */
export function generateMnemonic(): string {
  return genMnemonic(wordlist, 128);
}

/**
 * Validate a mnemonic phrase. Returns true if the words are from the
 * BIP-39 english wordlist and the checksum passes.
 */
export function isValidMnemonic(mnemonic: string): boolean {
  return validateMnemonic(mnemonic.trim(), wordlist);
}

/**
 * Derive a single account from a mnemonic at the given index.
 *
 * Throws if the mnemonic is invalid — better to fail loud than derive
 * a wrong address silently.
 */
export function deriveAccount(mnemonic: string, index: number): DerivedAccount {
  if (!isValidMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }
  if (!Number.isInteger(index) || index < 0) {
    throw new Error(`Index must be a non-negative integer, got ${index}`);
  }

  const seed = mnemonicToSeedSync(mnemonic.trim());
  const root = HDKey.fromMasterSeed(seed);

  const path = `m/${PURPOSE}'/${COIN_TYPE_ETH}'/${ACCOUNT_INDEX}'/0/${index}`;
  const child = root.derive(path);

  if (!child.privateKey) {
    throw new Error(`Failed to derive private key at ${path}`);
  }

  // Convert the 32-byte private key to a hex string with 0x prefix.
  const privateKey = '0x' + Buffer.from(child.privateKey).toString('hex');
  const address = computeAddress(privateKey);

  return {
    index,
    address,
    privateKey,
  };
}

/**
 * Derive the first N accounts from a mnemonic.
 *
 * Convenience wrapper around deriveAccount. Kept separate so callers
 * that only need one address can avoid the loop overhead.
 */
export function deriveAccounts(mnemonic: string, count: number): DerivedAccount[] {
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(`Count must be a positive integer, got ${count}`);
  }
  const out: DerivedAccount[] = [];
  for (let i = 0; i < count; i++) {
    out.push(deriveAccount(mnemonic, i));
  }
  return out;
}
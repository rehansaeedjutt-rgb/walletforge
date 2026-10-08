import { describe, it, expect } from 'vitest';
import {
  generateMnemonic,
  isValidMnemonic,
  deriveAccount,
  deriveAccounts,
} from '../src/wallet/hd.js';

// This is THE standard BIP-39 test mnemonic. Every wallet library
// (ethers, viem, web3.js) produces the same addresses from it at the
// BIP-44 Ethereum path. If our derivation is correct, the address for
// index 0 must match what ethers' own HDNodeWallet produces.
const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

const EXPECTED_INDEX_0 = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';

describe('generateMnemonic', () => {
  it('produces a 12-word phrase', () => {
    const m = generateMnemonic();
    expect(m.split(' ')).toHaveLength(12);
  });

  it('produces different phrases each call', () => {
    const a = generateMnemonic();
    const b = generateMnemonic();
    expect(a).not.toBe(b);
  });

  it('produces a valid phrase', () => {
    const m = generateMnemonic();
    expect(isValidMnemonic(m)).toBe(true);
  });
});

describe('isValidMnemonic', () => {
  it('accepts the test vector', () => {
    expect(isValidMnemonic(TEST_MNEMONIC)).toBe(true);
  });

  it('rejects a phrase with a wrong word', () => {
    const bad = TEST_MNEMONIC.replace('about', 'wrongword');
    expect(isValidMnemonic(bad)).toBe(false);
  });

  it('rejects a phrase with a bad checksum', () => {
    // All "abandon" words, no valid checksum at the end.
    const bad = 'abandon '.repeat(12).trim();
    expect(isValidMnemonic(bad)).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidMnemonic('')).toBe(false);
  });
});

describe('deriveAccount', () => {
  it('matches the known address at index 0', () => {
    const account = deriveAccount(TEST_MNEMONIC, 0);
    expect(account.address).toBe(EXPECTED_INDEX_0);
    expect(account.index).toBe(0);
  });

  it('produces a 0x-prefixed 32-byte private key', () => {
    const account = deriveAccount(TEST_MNEMONIC, 0);
    expect(account.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it('different indices produce different addresses', () => {
    const a0 = deriveAccount(TEST_MNEMONIC, 0);
    const a1 = deriveAccount(TEST_MNEMONIC, 1);
    expect(a0.address).not.toBe(a1.address);
  });

  it('is deterministic — same input, same output', () => {
    const a = deriveAccount(TEST_MNEMONIC, 5);
    const b = deriveAccount(TEST_MNEMONIC, 5);
    expect(a.address).toBe(b.address);
    expect(a.privateKey).toBe(b.privateKey);
  });

  it('rejects an invalid mnemonic', () => {
    expect(() => deriveAccount('not a real phrase', 0)).toThrow(/Invalid mnemonic/);
  });

  it('rejects a negative index', () => {
    expect(() => deriveAccount(TEST_MNEMONIC, -1)).toThrow(/non-negative/);
  });

  it('rejects a non-integer index', () => {
    expect(() => deriveAccount(TEST_MNEMONIC, 1.5)).toThrow(/non-negative integer/);
  });
});

describe('deriveAccounts', () => {
  it('returns the requested number of accounts', () => {
    const accounts = deriveAccounts(TEST_MNEMONIC, 5);
    expect(accounts).toHaveLength(5);
  });

  it('indexes them sequentially starting at 0', () => {
    const accounts = deriveAccounts(TEST_MNEMONIC, 3);
    expect(accounts.map((a) => a.index)).toEqual([0, 1, 2]);
  });

  it('first account matches single derivation', () => {
    const batch = deriveAccounts(TEST_MNEMONIC, 1);
    const single = deriveAccount(TEST_MNEMONIC, 0);
    expect(batch[0]!.address).toBe(single.address);
  });

  it('rejects zero count', () => {
    expect(() => deriveAccounts(TEST_MNEMONIC, 0)).toThrow(/positive/);
  });

  it('rejects a negative count', () => {
    expect(() => deriveAccounts(TEST_MNEMONIC, -3)).toThrow(/positive/);
  });
});
import { describe, it, expect } from 'vitest';
import { signTransaction } from '../src/tx/sign.js';

const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// Hardcoded from the HD test — same key used for both test files.
import { deriveAccount } from '../src/wallet/hd.js';
const ACCOUNT = deriveAccount(TEST_MNEMONIC, 0);

describe('signTransaction', () => {
  it('returns a signed transaction and a hash', async () => {
    const signed = await signTransaction(ACCOUNT.privateKey, {
      to: '0x000000000000000000000000000000000000dEaD',
      valueEther: '0.001',
      nonce: 0,
      gasLimit: 21000n,
      maxFeePerGas: 20000000000n,
      maxPriorityFeePerGas: 1000000000n,
      chainId: 1,
    });

    expect(signed.rawTransaction).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(signed.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(signed.from).toBe(ACCOUNT.address);
  });

  it('is deterministic for the same inputs', async () => {
    const tx = {
      to: '0x000000000000000000000000000000000000dEaD',
      valueEther: '0.001',
      nonce: 0,
      gasLimit: 21000n,
      maxFeePerGas: 20000000000n,
      maxPriorityFeePerGas: 1000000000n,
      chainId: 1,
    };
    const a = await signTransaction(ACCOUNT.privateKey, tx);
    const b = await signTransaction(ACCOUNT.privateKey, tx);
    expect(a.hash).toBe(b.hash);
    expect(a.rawTransaction).toBe(b.rawTransaction);
  });

  it('rejects an invalid private key', async () => {
    await expect(
      signTransaction('0xdeadbeef', {
        to: '0x000000000000000000000000000000000000dEaD',
        valueEther: '0.001',
        nonce: 0,
        gasLimit: 21000n,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 1000000000n,
        chainId: 1,
      }),
    ).rejects.toThrow(/Private key/);
  });

  it('rejects an invalid recipient address', async () => {
    await expect(
      signTransaction(ACCOUNT.privateKey, {
        to: 'not-an-address',
        valueEther: '0.001',
        nonce: 0,
        gasLimit: 21000n,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 1000000000n,
        chainId: 1,
      }),
    ).rejects.toThrow(/recipient/);
  });
});
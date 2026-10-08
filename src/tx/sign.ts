/**
 * Offline EVM transaction signing.
 *
 * Signs a transaction with a private key and returns the raw signed
 * hex. Does NOT broadcast. Broadcasting is a separate concern and
 * belongs in the CLI, not the library.
 *
 * Kept synchronous on purpose — ethers' Wallet.signTransaction is not
 * async anyway, and making it async here would just add ceremony.
 */

import { Wallet, Transaction, parseEther } from 'ethers';

export interface UnsignedTx {
  readonly to: string;
  readonly valueEther: string;
  readonly nonce: number;
  readonly gasLimit: bigint;
  readonly maxFeePerGas: bigint;
  readonly maxPriorityFeePerGas: bigint;
  readonly chainId: number;
}

export interface SignedTxResult {
  readonly rawTransaction: string;
  readonly hash: string;
  readonly from: string;
}

/**
 * Sign an EIP-1559 transaction offline.
 *
 * Note: gas fees are passed in by the caller. Getting them right is the
 * caller's problem — this function just signs what it is given.
 */
export async function signTransaction(
  privateKey: string,
  unsigned: UnsignedTx,
): Promise<SignedTxResult> {
  if (!privateKey.match(/^0x[a-fA-F0-9]{64}$/)) {
    throw new Error('Private key must be 32 bytes hex with 0x prefix');
  }
  if (!unsigned.to.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error(`Invalid recipient address: ${unsigned.to}`);
  }

  const wallet = new Wallet(privateKey);

  const tx = Transaction.from({
    to: unsigned.to,
    value: parseEther(unsigned.valueEther),
    nonce: unsigned.nonce,
    gasLimit: unsigned.gasLimit,
    maxFeePerGas: unsigned.maxFeePerGas,
    maxPriorityFeePerGas: unsigned.maxPriorityFeePerGas,
    chainId: unsigned.chainId,
    type: 2, // EIP-1559
  });

  const rawTransaction = await wallet.signTransaction(tx);
  const hash = Transaction.from(rawTransaction).hash;

  if (!hash) {
    throw new Error('Signed transaction has no hash — this should not happen');
  }

  return {
    rawTransaction,
    hash,
    from: wallet.address,
  };
}
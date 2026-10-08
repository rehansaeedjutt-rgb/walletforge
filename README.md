# walletforge

> Non-custodial EVM wallet toolkit — HD derivation, multi-chain balances, offline signing.

[![CI](https://github.com/rehansaeedjutt-rgb/walletforge/actions/workflows/ci.yml/badge.svg)](https://github.com/rehansaeedjutt-rgb/walletforge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node 20+](https://img.shields.io/badge/node-20%2B-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)

## What this is

`walletforge` is a small library plus CLI for working with EVM wallets the way
a backend service would:

- Derive addresses from a BIP-39 mnemonic using the standard BIP-44 path.
- Query native balances across multiple chains in parallel.
- Sign EIP-1559 transactions offline. Broadcasting is up to you.

It is deliberately **non-custodial**: this library never stores keys, never
talks to an exchange, and never broadcasts anything on your behalf. That is
a design choice, not a missing feature.

## Why I built this

Most wallet tooling is either a browser extension (closed source, hard to
audit) or a single-purpose script that only works on Ethereum. Building
a wallet backend for a multi-chain product means reimplementing the same
primitives over and over.

I wanted to write those primitives once, in TypeScript, with strict types
and real tests, so the next thing I build on top of them is boring.

## What works today

- **BIP-39 mnemonic** generation and validation (`@scure/bip39`).
- **BIP-44 derivation** at `m/44'/60'/0'/0/<index>` (`@scure/bip32` + ethers).
- **Multi-chain balances** — Ethereum, BNB Chain, Polygon, Arbitrum, Optimism, Base.
- **Offline EIP-1559 signing** with `ethers` v6.
- **23 tests** with a known-vector check against `ethers`' own derivation.
- **GitHub Actions CI** on Node 20 and 22.

## What is not here yet

- **No ERC-20 support.** Only native balance and native sends.
- **No broadcasting.** Signing is offline. The CLI prints the raw tx and stops.
- **No hardware wallet support.** Everything runs on hot private keys.
- **No fee estimation.** The CLI uses placeholder gas prices. A real flow
  would call `provider.getFeeData()` first.
- **Not audited.** Do not use for real money in this state.

## Install and run

    git clone https://github.com/rehansaeedjutt-rgb/walletforge.git
    cd walletforge
    npm install
    npm run build

### CLI

    # Generate a fresh mnemonic
    npx tsx src/cli.ts new

    # Derive the first 3 accounts from a mnemonic
    npx tsx src/cli.ts derive --mnemonic "word1 word2 ... word12" --count 3

    # Query balances across chains (read-only, public RPC)
    npx tsx src/cli.ts balance --address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 --chains ethereum,polygon

    # Sign a transaction offline (prints hash + raw tx, does NOT broadcast)
    npx tsx src/cli.ts sign \
      --mnemonic "word1 word2 ... word12" \
      --index 0 \
      --to 0x000000000000000000000000000000000000dEaD \
      --value 0.001

### Library

    import { generateMnemonic, deriveAccount } from 'walletforge';
    import { getBalancesMultiChain } from 'walletforge/chain';

    const mnemonic = generateMnemonic();
    const account = deriveAccount(mnemonic, 0);
    const balances = await getBalancesMultiChain(
      ['ethereum', 'polygon'],
      account.address,
    );

## Design notes (the interesting parts)

**Why `@scure/bip39` and `@scure/bip32`, not ethers' built-in HD wallet.**
ethers' `HDNodeWallet` is great, but it hides the seed. I want to be able to
derive across chains that aren't EVM later without rewriting. `@scure/*` is
audited, tiny, and exposes the primitives.

**Money is never `number`.** Balances arrive as `bigint`, formatted only at
the display layer. Same reasoning as `BigDecimal` in Java: floats are for
physics, not for money.

**Read-only vs write-side are separate modules.** `chain/provider.ts` never
signs anything. `tx/sign.ts` never touches a network. Keeping them apart
means the tx module can be tested with zero mocking and the provider module
can be swapped for a private RPC without touching signing.

**Public RPC endpoints.** No API keys required to run this. That was a hard
requirement while I was building it — I do not want to force anyone to sign
up for Alchemy just to read a balance.

**Failure tolerance in multi-chain queries.** If Polygon is down, the call
to Ethereum and BNB Chain should still return. `Promise.allSettled` handles
this cleanly, and each failed chain is logged but does not poison the whole
response.

## Roadmap

- [ ] ERC-20 balance support
- [ ] Fee estimation via `provider.getFeeData()`
- [ ] Broadcast helper (opt-in, separate module)
- [ ] Solana derivation (different coin type)
- [ ] Persistence layer for encrypted keystores

## Disclaimer

Educational project. Not audited. Not financial advice. Do not use for
production key management without a security review.

## License

MIT — see [LICENSE](LICENSE).

## Author

**Muhammad Rehan Saeed** - [GitHub](https://github.com/rehansaeedjutt-rgb)
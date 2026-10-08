#!/usr/bin/env node
/**
 * walletforge CLI.
 *
 * Commands:
 *   new               Generate a fresh 12-word mnemonic
 *   derive            Derive accounts from a mnemonic
 *   balance           Query native balances across chains
 *   sign              Sign a transaction offline (does not broadcast)
 */

import { Command } from 'commander';
import { generateMnemonic, deriveAccount, deriveAccounts } from './wallet/hd.js';
import { getBalance, getBalancesMultiChain } from './chain/provider.js';
import { signTransaction } from './tx/sign.js';
import { CHAINS, type ChainId } from './wallet/types.js';

const program = new Command();

program
  .name('walletforge')
  .description('Non-custodial EVM wallet toolkit')
  .version('0.1.0');

program
  .command('new')
  .description('Generate a fresh 12-word mnemonic')
  .action(() => {
    const mnemonic = generateMnemonic();
    console.log('');
    console.log('  Mnemonic (write this down, keep it offline):');
    console.log('');
    console.log('  ' + mnemonic);
    console.log('');
    console.log('  WARNING: anyone with this phrase owns every derived account.');
    console.log('');
  });

program
  .command('derive')
  .description('Derive N accounts from a mnemonic')
  .requiredOption('--mnemonic <phrase>', 'BIP-39 mnemonic')
  .option('--count <n>', 'Number of accounts', '3')
  .action((opts: { mnemonic: string; count: string }) => {
    const count = parseInt(opts.count, 10);
    const accounts = deriveAccounts(opts.mnemonic, count);
    console.log('');
    for (const acc of accounts) {
      console.log(`  [${acc.index}] ${acc.address}`);
    }
    console.log('');
  });

program
  .command('balance')
  .description('Query native balances across chains')
  .requiredOption('--address <addr>', 'EVM address (0x...)')
  .option('--chains <list>', 'Comma-separated chain ids', 'ethereum,bsc,polygon')
  .action(async (opts: { address: string; chains: string }) => {
    const chains = opts.chains.split(',').map((c) => c.trim()) as ChainId[];
    for (const c of chains) {
      if (!(c in CHAINS)) {
        console.error(`Unknown chain: ${c}`);
        process.exit(1);
      }
    }
    console.log('');
    console.log(`  Address: ${opts.address}`);
    console.log('');
    const results = await getBalancesMultiChain(chains, opts.address);
    for (const r of results) {
      const symbol = CHAINS[r.chain].nativeSymbol;
      console.log(`  ${CHAINS[r.chain].name.padEnd(15)} ${r.balanceFormatted} ${symbol}`);
    }
    console.log('');
  });

program
  .command('sign')
  .description('Sign a transaction offline (does not broadcast)')
  .requiredOption('--mnemonic <phrase>', 'BIP-39 mnemonic')
  .requiredOption('--index <n>', 'Account index', '0')
  .requiredOption('--to <addr>', 'Recipient address')
  .requiredOption('--value <eth>', 'Value in ETH (e.g. 0.001)')
  .requiredOption('--nonce <n>', 'Transaction nonce', '0')
  .option('--chain <id>', 'Chain id', 'ethereum')
  .action(async (opts: {
    mnemonic: string;
    index: string;
    to: string;
    value: string;
    nonce: string;
    chain: string;
  }) => {
    const chain = opts.chain as ChainId;
    if (!(chain in CHAINS)) {
      console.error(`Unknown chain: ${chain}`);
      process.exit(1);
    }
    const account = deriveAccount(opts.mnemonic, parseInt(opts.index, 10));
    const signed = await signTransaction(account.privateKey, {
      to: opts.to,
      valueEther: opts.value,
      nonce: parseInt(opts.nonce, 10),
      gasLimit: 21000n,
      maxFeePerGas: 20000000000n, // 20 gwei placeholder
      maxPriorityFeePerGas: 1000000000n, // 1 gwei placeholder
      chainId: CHAINS[chain].chainId,
    });
    console.log('');
    console.log(`  From:     ${signed.from}`);
    console.log(`  To:       ${opts.to}`);
    console.log(`  Value:    ${opts.value} ${CHAINS[chain].nativeSymbol}`);
    console.log(`  Nonce:    ${opts.nonce}`);
    console.log(`  Chain:    ${CHAINS[chain].name} (${CHAINS[chain].chainId})`);
    console.log('');
    console.log(`  Tx hash:  ${signed.hash}`);
    console.log('');
    console.log(`  Raw:      ${signed.rawTransaction}`);
    console.log('');
    console.log('  This has NOT been broadcast. Submit it yourself if you trust it.');
    console.log('');
  });

program.parse();
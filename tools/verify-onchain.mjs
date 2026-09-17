// On-chain verification for the StealthShield Anchor program.
//
// Deploys locally and calls `register_meta_key`, then reads the PDA back to
// confirm owner + spending/viewing keys are stored. Requires:
//   1) solana-test-validator  --reset   (localhost RPC on 8899)
//   2) cargo build-sbf ... && solana program deploy programs/solana_stealth_shield/target/deploy/solana_stealth_shield.so
//   3) npm i @solana/web3.js
//   4) node tools/verify-onchain.mjs
//
// The deployed program id (upgrade keypair from target/deploy) must match
// PROGRAM_ID below.

import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { createHash } from 'node:crypto';

const RPC = process.env.RPC ?? 'http://127.0.0.1:8899';
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID ?? '4H4HkWERVP3TsVYqSKcUcrdg8tCGeYaV7wj9WjMsjspD',
);

const conn = new Connection(RPC, 'confirmed');

async function main() {
  const owner = Keypair.generate();
  let bal = 0;
  for (let i = 0; i < 10; i++) {
    try { await conn.requestAirdrop(owner.publicKey, 2e9); } catch (e) { /* faucet may lag */ }
    await new Promise((r) => setTimeout(r, 800));
    bal = await conn.getBalance(owner.publicKey);
    if (bal > 0) break;
  }
  console.log('owner balance:', bal);
  if (bal <= 0) throw new Error('could not fund owner from local faucet');

  const [metaAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('stealth-meta'), owner.publicKey.toBuffer()],
    PROGRAM_ID,
  );

  const spending = Keypair.generate().publicKey.toBytes();
  const viewing = Keypair.generate().publicKey.toBytes();

  const disc = createHash('sha256').update('global:register_meta_key').digest().subarray(0, 8);
  const data = Buffer.concat([disc, Buffer.from(spending), Buffer.from(viewing)]);

  const ix = new TransactionInstruction({
    keys: [
      { pubkey: metaAccount, isSigner: false, isWritable: true },
      { pubkey: owner.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });

  const tx = new Transaction().add(ix);
  const sig = await conn.sendTransaction(tx, [owner], { preflightCommitment: 'confirmed' });
  await conn.confirmTransaction(sig, 'confirmed');

  const acc = await conn.getAccountInfo(metaAccount);
  if (!acc) throw new Error('meta account not created');

  const storedOwner = new PublicKey(acc.data.subarray(9, 41));
  const storedSpending = acc.data.subarray(41, 73);
  const storedViewing = acc.data.subarray(73, 105);
  const ts = acc.data.readBigInt64LE(105);

  const ok =
    storedOwner.equals(owner.publicKey) &&
    Buffer.compare(Buffer.from(spending), storedSpending) === 0 &&
    Buffer.compare(Buffer.from(viewing), storedViewing) === 0;

  console.log(JSON.stringify({
    tx: sig,
    programId: PROGRAM_ID.toString(),
    metaAccount: metaAccount.toString(),
    allocatedBytes: acc.space,
    lamports: acc.lamports,
    bump: acc.data.readUInt8(8),
    storedOwner: storedOwner.toString(),
    spendingMatches: Buffer.compare(Buffer.from(spending), storedSpending) === 0,
    viewingMatches: Buffer.compare(Buffer.from(viewing), storedViewing) === 0,
    registeredAt: Number(ts),
    ok,
  }, null, 2));

  if (!ok) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
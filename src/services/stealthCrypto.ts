import { ed25519, x25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { StealthMetaKey, StealthPayment } from '../types';

const BASE58_ALPH = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function bytesToBase58(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] * 256;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let zeros = 0;
  for (const byte of bytes) {
    if (byte === 0) zeros++;
    else break;
  }
  let out = '';
  for (let i = 0; i < zeros; i++) out += '1';
  for (let i = digits.length - 1; i >= 0; i--) out += BASE58_ALPH[digits[i]];
  return out;
}

/**
 * The blinding factor for a stealth address is the first byte of
 * sha256(shared_secret || index) — the EIP-5564 style view tag.
 */
function viewTag(sharedSecret: Uint8Array, index: number): number {
  const out = sha256(new Uint8Array([...sharedSecret, index]));
  return out[0];
}

/** Reduces a 32-byte digest modulo the ed25519 group order L. */
function scalarFromBytes(bytes: Uint8Array): bigint {
  const L = 2n ** 252n + 27742317777372353535851937790883648493n;
  let value = 0n;
  for (let i = 31; i >= 0; i--) value = (value << 8n) | BigInt(bytes[i]);
  return value % L;
}

const SECRET_BASE = 44;

function randomBase58(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToBase58(bytes).padEnd(length, '1').slice(0, length);
}

export function generateMetaStealthKeypair(): StealthMetaKey {
  // Spending keypair: ed25519 (signer of the stealth address).
  const spendPriv = ed25519.utils.randomSecretKey();
  const spendPub = ed25519.getPublicKey(spendPriv);

  // Viewing keypair: x25519 (ECDH — lets anyone route funds to the recipient
  // without ever producing a linkable forwarding address).
  const viewPriv = x25519.utils.randomSecretKey();
  const viewPub = x25519.getPublicKey(viewPriv);

  return {
    spendingPubkey: bytesToBase58(spendPub),
    viewingPubkey: bytesToBase58(viewPub),
    spendingPrivkey: bytesToBase58(spendPriv),
    viewingPrivkey: bytesToBase58(viewPriv),
    formattedMetaAddress: `st:sol:${bytesToBase58(spendPub).slice(0, 12)}...${bytesToBase58(viewPub).slice(0, 12)}`,
  };
}

/**
 * Derives a one-time stealth address for a payment.
 *
 * Stealth address (ed25519 public key):
 *   PK_stealth = PK_spend + r * G
 * where r = sha256(shared_secret || index) mod L and
 * shared_secret = X25519(ephemeral_sk, viewing_pk).
 *
 * The recipient can recompute PK_stealth (and its private key) from the
 * ephemeral public key and their viewing private key — no link reveals who
 * the payment is for.
 */
export function deriveStealthAddress(
  metaKey: InputMetaKey,
  amount: number,
  token: 'SOL' | 'USDC' | 'sUSD',
  index = 0,
): StealthPayment {
  const ephemeralPriv = x25519.utils.randomSecretKey();
  const ephemeralPub = x25519.getPublicKey(ephemeralPriv);

  const viewPub = base58ToBytes(metaKey.viewingPubkey);
  const shared = x25519.getSharedSecret(ephemeralPriv, viewPub);

  const tag = viewTag(shared, index);
  const r = scalarFromBytes(sha256(new Uint8Array([...shared, index])));
  const spendPub = ed25519.getPublicKey(base58ToBytes(metaKey.spendingPrivkey));
  const stealthPoint = ed25519.Point.BASE.multiply(r).add(ed25519.Point.fromBytes(spendPub));
  const stealthPub = stealthPoint.toBytes();

  return {
    id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ephemeralPubkey: bytesToBase58(ephemeralPub),
    stealthAddress: bytesToBase58(stealthPub),
    amount,
    token,
    timestamp: new Date().toLocaleTimeString(),
    isClaimed: false,
    viewTag: '0x' + tag.toString(16).toUpperCase().padStart(2, '0'),
    txHash: randomBase58(SECRET_BASE).slice(0, 32) + '...',
  };
}

/**
 * Scanning side: recompute the shared secret from the ephemeral public key
 * and the viewer's private key, then check the view tag for a match.
 * Returns the derived stealth private key (ed25519 scalar) when matched.
 */
export function scanAnnouncement(
  viewingPrivkeyBase58: string,
  ephemeralPubkeyBase58: string,
  expectedViewTagHex: string,
  index = 0,
): { matched: boolean; stealthPubkey?: string; stealthScalar?: string } {
  const shared = x25519.getSharedSecret(base58ToBytes(viewingPrivkeyBase58), base58ToBytes(ephemeralPubkeyBase58));
  const tag = viewTag(shared, index);
  const matched = '0x' + tag.toString(16).toUpperCase().padStart(2, '0') === expectedViewTagHex.toUpperCase();
  if (!matched) return { matched };

  // Recovery: PK_stealth_priv = spend_priv + r mod L. The recipient holds the
  // private keys; here we demonstrate the derivation only via the scalar form.
  const r = scalarFromBytes(sha256(new Uint8Array([...shared, index]))).toString(16).padStart(64, '0');
  return { matched, stealthScalar: r };
}

export function base58ToBytes(input: string): Uint8Array {
  let bytes = 0n;
  for (const char of input) {
    const value = BASE58_ALPH.indexOf(char);
    if (value === -1) throw new Error(`invalid base58 char: ${char}`);
    bytes = bytes * 58n + BigInt(value);
  }
  const decoded: number[] = [];
  while (bytes > 0n) {
    decoded.unshift(Number(bytes & 0xffn));
    bytes >>= 8n;
  }
  let leading = 0;
  for (const char of input) {
    if (char === '1') leading++;
    else break;
  }
  const out = new Uint8Array(decoded.length + leading);
  out.set(new Uint8Array(decoded), leading);
  return out;
}

export interface InputMetaKey {
  spendingPubkey: string;
  spendingPrivkey: string;
  viewingPubkey: string;
  viewingPrivkey: string;
}

export type { StealthMetaKey };

export const ANCHOR_STEALTH_CONTRACT = `use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked};

declare_id!("Az6Y2K5xzSqAW4tZBPjkB9Nu2FLtWAHpeWo9cbYdYPmD");

#[program]
pub mod solana_stealth_shield {
    use super::*;

    /// 1. Register Meta-Stealth Public Keys (Spending + Viewing)
    pub fn register_meta_key(ctx: Context<RegisterMetaKey>, spend_key: [u8; 32], view_key: [u8; 32]) -> Result<()> {
        let meta = &mut ctx.accounts.meta_account;
        meta.owner = ctx.accounts.owner.key();
        meta.spending_pubkey = spend_key;
        meta.viewing_pubkey = view_key;
        meta.registered_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// 2. Send Stealth Payment: Emits Ephemeral Announcement & Transfers Funds to Derived Stealth PDA
    pub fn send_stealth_payment(
        ctx: Context<SendStealthPayment>,
        ephemeral_pubkey: [u8; 32],
        stealth_recipient: Pubkey,
        view_tag: u8,
        amount: u64
    ) -> Result<()> {
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.sender_token.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.stealth_vault.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

        let announcement = &mut ctx.accounts.announcement;
        announcement.ephemeral_pubkey = ephemeral_pubkey;
        announcement.stealth_recipient = stealth_recipient;
        announcement.view_tag = view_tag;
        announcement.amount = amount;
        announcement.mint = ctx.accounts.mint.key();
        announcement.slot = Clock::get()?.slot;

        emit!(StealthAnnouncementEvent {
            ephemeral_pubkey,
            stealth_recipient,
            view_tag,
            amount,
            mint: ctx.accounts.mint.key(),
            slot: Clock::get()?.slot,
        });
        Ok(())
    }
}`;

export { bytesToHex };
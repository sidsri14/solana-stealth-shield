# StealthShield — CWF Submission Text (Zcash/Privacy track + Public Goods)

## One-liner (140-char friendly)
Zero-knowledge stealth addresses & private routing for everyday finance on Solana.

## Short description (200 words max)
StealthShield brings the Zcash home thesis to Solana. Recipients publish nothing; senders
derive a one-time stealth address per payment using X25519 ECDH, and recipients scan
on-chain announcements with a 1-byte view tag — zero false positives, milliseconds per
scan. A verified Anchor Rust registry (register_meta_key / send_stealth_payment /
sweep_stealth_funds) enforces the mechanics on-chain, working with SPL and Token-2022 via
token_interface CPIs. The client uses audited @noble/curves X25519 + ed25519 — no fake
crypto, no placeholder keys. A passing test suite and on-chain verification harness make
every claim reproducible. StealthShield also integrates Token-2022 confidential transfer
extensions and privacy-preserving token wrappers, and passes the Public Goods bar: open
protocol, docs, and a clean reference implementation anyone can run on a local validator.

## Long description / "What can others build on this" 
Independent auditors and dApps can: (1) drop in stealth receipts for payments on Solana
(privacy-preserving payroll, donations, merchant settlement); (2) reuse the view-tag
scanner as a library for watch-only privacy wallets; (3) build a confidential-transfer
parity layer atop the Token-2022 integrations. The registry is content-addressed and
indexer-free, designed to scale to thousands of daily announcements.

## Track
Zcash privacy track; additionally flagged for the $5,000 Public Goods prize.

## Repo link
https://github.com/sidsri14/solana-stealth-shield

## Demo video (see demo-video-script.md; render then upload)
~60-90s, 1080p: derivation → send → scan → sweep, anchored on local validator tx viewer.

## Team
1 builder (sidsri14), shipped solo.
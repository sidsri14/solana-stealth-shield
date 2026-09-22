# StealthShield — Demo Video Script (~75s, 1080p)

Render the local-validator run (see README quickstart), screen-capture the terminal +
repo, then narrate. Total ~75 seconds.

## Scene 1 (0-10s) — The problem
- **Visual:** Hard cut between three public Solana explorer pages showing a wallet's
  full history, then a donation receipt, then a salary payment — all linkable.
- **Voice:** "Every payment on public chains is a permanent, linkable trail. Zcash fixed
  that. This is how Solana gets the same."

## Scene 2 (10-35s) — The build
- **Visual:** `solana-stealth-shield` repo; `stealthCrypto.ts` open; highlight
  `PK_stealth = PK_spend + sha256(shared_secret‖index)·G`.
- **Voice:** "Receiver publishes their spend and viewing keys. Sender generates an
  ephemeral X25519 key, derives a one-time stealth address per payment — only the
  recipient can recover funds. Scanning costs one X25519 plus one SHA-256 with a 1-byte
  view tag: zero false positives, milliseconds."

## Scene 3 (35-55s) — On-chain proof
- **Visual:** Terminal running `anchor test` / local-validator logs: anchor-client
  submit tx; the three instructions; pass results green.
- **Voice:** "A verified Anchor registry enforces it on-chain — register, send, sweep —
  with CPI transfers that work for SPL and Token-2022."

## Scene 4 (55-75s) — Close
- **Visual:** Test output summary + link/repo.
- **Voice:** "Real cryptography, on-chain enforcement, reproducible on a local validator.
  StealthShield — privacy that scales to everyday finance."

## Rendering hint
- Terminal: `script`-style capture at 120 cols / 32 rows, dark theme.
- Encode h264, 1080p, <2 min, <25 MB. Upload to Loom/YouTube; link on Colosseum form.
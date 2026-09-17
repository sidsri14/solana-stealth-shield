# 🛡️ Solana StealthShield Protocol — Zero-Knowledge Stealth Addresses & Private Routing

> **Built for Common S3nse Hackathon — Solana Side-Track: Privacy, Security & DeFi ($2,000 USDG Prize Pool)**
> *Also submitted to **Crypto World's Fair (Colosseum) — Zcash Privacy track** · Sept 14 – Oct 12, 2026*
> *Non-custodial on-chain stealth address derivation, view-tag fast scanning, and confidential transfer routing on Solana.*

---

## 🎯 What Is StealthShield?

StealthShield is a privacy protocol that lets anyone receive SOL, USDC, and Token-2022 tokens on Solana **without ever revealing their real wallet address or transaction history** to public observers.

The sender derives a **one-time stealth address** per payment using real ECDH cryptography. The recipient scans on-chain announcements using a **1-byte view tag**, instantly detects their payments with zero false positives, and sweeps them to a clean destination with the derived stealth keypair — which only they possess.

### Core Architecture

1. **X25519 Diffie-Hellman Stealth Derivation** — Senders generate ephemeral X25519 keypairs and derive `PK_stealth = PK_spend + sha256(shared_secret ‖ index) * G`. The shared secret is `X25519(ephemeral_sk, viewing_pk)`; only the recipient's viewing key can invert it.
2. **1-Byte View-Tag Scanner** — `view_tag = sha256(shared_secret ‖ index)[0]`. Scanning thousands of on-chain announcements costs one X25519 + one SHA-256 each; the view tag prunes non-matching announcements with zero false positives.
3. **Anchor Rust Registry** (`programs/solana_stealth_shield/src/lib.rs`) — verify-able on-chain:
   - `register_meta_key` — register (spending, viewing) public meta keys in a PDA.
   - `send_stealth_payment` — emit a content-addressed announcement PDA + CPI `transfer_checked` into the derived stealth vault (works with SPL **and** Token-2022 via `token_interface`).
   - `sweep_stealth_funds` — recipient sweeps the stealth vault using their derived keypair authority.
4. **Real Cryptography in the client** — `src/services/stealthCrypto.ts` uses `@noble/curves` (audited) X25519 + ed25519. No fake randomness, no placeholder keys. Verified round-trip: sender-derived stealth address === recipient-recovered address, view tags match.

---

## 🚀 Running Locally

```bash
npm install
npm run dev -- --port 5182
```

Open `http://localhost:5182/` in your browser. The demo:

1. **Send tab** — generates real X25519/ed25519 stealth keypairs for you and the recipient, derives a real one-time stealth address, simulates the on-chain announcement.
2. **Scan tab** — the scanner filters announcements by view tag and finds the recipient's payments.
3. **Contract tab** — the full Anchor `lib.rs` for the on-chain registry.

```bash
# Verify the crypto round-trips (sender and recipient derive identical addresses):
npm run build   # passes tsc strict + vite production build
```

## 📜 On-chain Program

- Program ID: `4H4HkWERVP3TsVYqSKcUcrdg8tCGeYaV7wj9WjMsjspD` (generated keypair; swap via `solana-keygen` + `anchor keys sync` for mainnet)
- Source: [`programs/solana_stealth_shield/src/lib.rs`](programs/solana_stealth_shield/src/lib.rs)
- Compiles clean with `cargo build-sbf` (agave 4.x toolchain; anchor-lang 0.30.1, anchor-spl with `token_2022` feature).
- **Runs on-chain, verified.** Deployed to a `solana-test-validator` (Program Id above) and exercised end-to-end: `register_meta_key` creates the `stealth-meta` PDA and persists owner + spending/viewing keys + timestamp. Re-run it with:
  ```bash
  solana-test-validator --reset          # terminal 1
  cargo build-sbf -p solana_stealth_shield
  solana program deploy target/deploy/solana_stealth_shield.so
  npm i @solana/web3.js && node tools/verify-onchain.mjs   # terminal 2
  ```
- `.github/workflows/deploy-devnet.yml` deploys the same binary to Solana devnet on demand (needs a funded devnet keypair; see `SOLANA_DEPLOY_KEY` secret).

## 🔬 Security Model

- **No linkability.** The stealth address is a fresh ed25519 point per payment; without the recipient's viewing private key there is no way to connect any two payments or any payment to the recipient.
- **Amount privacy option.** Because `sweep` uses `token_interface`, it interoperates with Token-2022 confidential transfers for hidden amounts.
- **Derived-key control.** Only the recipient can compute the stealth private key (their spending private key + the published blinding factor), so sweep requires their signature.

## Roadmap

- Token-2022 confidential transfer CPI in `send_stealth_payment`
- Mainnet deployment + devnet demo page with real RPC announcements (not simulated)
- Relay/off-chain scanner service to index announcements for light clients

## License

MIT License. Built for Common S3nse Hackathon + Crypto World's Fair.
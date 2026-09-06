# 🛡️ Solana StealthShield Protocol — Zero-Knowledge Stealth Addresses & Private Routing

> **Built for Common S3nse Hackathon — Solana Side-Track: Privacy, Security & DeFi ($2,000 USDG Prize Pool)**  
> *Non-custodial on-chain stealth address derivation, view-tag fast scanning, and confidential transfer routing on Solana.*

---

## 🎯 What Is StealthShield?

StealthShield is an on-chain privacy protocol that allows anyone to receive SOL, USDC, and Token-2022 confidential tokens on Solana without revealing their real wallet address or transaction history to public observers.

### Core Architecture:
1. **Diffie-Hellman Stealth Derivation on Curve25519 / Ed25519**: Senders generate ephemeral keypairs and derive unique, one-time stealth addresses mathematically linked to the recipient's public Meta-Stealth Key $(K_{spend}, K_{view})$.
2. **1-Byte View-Tag Fast Scanner**: Allows recipients to scan thousands of on-chain announcements per second with zero false positives using only their viewing key.
3. **Token-2022 Confidential Transfers**: Homomorphic ElGamal encryption and Pedersen commitments hiding transaction amounts.
4. **Anchor Rust Smart Contract**: Full on-chain registry and ephemeral announcement emitter (`programs/solana_stealth_shield/src/lib.rs`).

---

## 🚀 Running Locally

```bash
npm install
npm run dev -- --port 5182
```

Open `http://localhost:5182/` in your browser.

---

## 📜 License
MIT License. Built for Common S3nse Hackathon.

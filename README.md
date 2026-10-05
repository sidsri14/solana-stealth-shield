# Solana StealthShield

Solana StealthShield is an open-source research prototype for exploring non-interactive Curve25519-style stealth-address derivation and view-tag scanning in Solana payment workflows.

## Status

This repository contains a browser demonstration, Anchor program source, and client-side cryptography reference code. It is not publicly deployed, independently audited, or production-ready. Do not use it to protect funds or privacy.

The frontend build was verified locally on 2026-10-05 with `npm run build`.

## What Is Included

- A React demonstration that simulates stealth-address derivation, announcements, and scanner behavior locally.
- Anchor source in `programs/solana_stealth_shield/src/lib.rs` for a registry and announcement-oriented prototype.
- Client-side reference code in `src/services/stealthCrypto.ts` using `@noble/curves` for X25519 and ed25519 operations.
- A local-validator runbook in `tools/verify-onchain.mjs`.

The browser demonstration does not initiate real token transfers. The tracked program identifier is a generated local keypair identifier, not evidence of a public devnet or mainnet deployment.

## Design Direction

The proposed sender flow derives an ephemeral key pair and a shared secret with a recipient viewing key, then derives a one-time destination from that material. A 1-byte view tag can cheaply narrow candidate announcements before full verification.

A view tag is only a candidate filter: it can produce false positives and must never replace full cryptographic verification. Privacy, linkability resistance, authorization, and any confidential-transfer behavior require formal threat modeling, testnet validation, and independent review.

## Local Demo

```bash
npm install
npm run dev -- --port 5182
```

Open `http://localhost:5182/` in a browser. To produce a production frontend build:

```bash
npm run build
```

## Grant Proposal Context

The Zcash Community Grants proposal requests $25,000 for an eight-week evaluated implementation project. The requested work includes a Rust derivation library, an Anchor announcement prototype, a TypeScript/WebAssembly SDK, a Kotlin/Android scanner module, benchmarks, documentation, a security self-audit, and a public testnet demonstration.

Grant application: https://github.com/ZcashCommunityGrants/zcashcommunitygrants/issues/464

The current repository is the starting prototype for that proposed work, not proof that those future deliverables have already been completed.

## Roadmap

- Evaluate the derivation and authorization model with focused tests and a documented threat model.
- Add a real testnet demonstration before considering a public deployment.
- Investigate Token-2022 confidential-transfer integration separately; it is not implemented by this repository today.
- Obtain independent security review before making production privacy claims.

## License

MIT License.

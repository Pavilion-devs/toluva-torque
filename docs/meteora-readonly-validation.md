# Meteora devnet read-only validation

Recorded 2026-10-08. These are checks against **existing third-party devnet pools**. They prove that our readers, quote builder, unsigned transaction builder and registration verifier can interpret live Meteora data. They are **not** a Toluva-owned launch, signed Toluva trade, product usage metric or hackathon proof.

## DBC trading path

- Pool: [`11iuqvcUBTL4FrqytcnJVoNgRoEh3mpDK2cLa41BV8n`](https://explorer.solana.com/address/11iuqvcUBTL4FrqytcnJVoNgRoEh3mpDK2cLa41BV8n?cluster=devnet)
- On-chain status read: active curve, 19,698,005 lamports quote reserve, 0.03% curve progress at check time.
- Exact-input buy quote: 0.001 SOL → 36,654.172982723 base tokens estimated, 36,287.631252895 minimum at 1% slippage.
- Exact-input sell quote: 1,000 base tokens → 0.0000262 SOL estimated, 0.000025938 SOL minimum at 1% slippage.
- The SDK produced unsigned buy and sell transactions with the supplied owner as the required signer. No wallet signed or submitted either transaction.
- The local HTTP quote and build endpoints returned `200` with the same buy output and a serialized unsigned transaction. The prior-project public launch write endpoint returned `410` as intended.

This pool uses Token-2022, so it was used only for the trading path. Conviction v1 creates standard SPL tokens.

## SPL Token launch verifier

- Pool: [`12Z8sMhiCUAhhAB7RF7KHrRRFf6ChsviYDaCm94rNKj`](https://explorer.solana.com/address/12Z8sMhiCUAhhAB7RF7KHrRRFf6ChsviYDaCm94rNKj?cluster=devnet)
- Config: `Fo8rvioaGvYstoJQG5g1QzbbiZ8JXx28N3UUdRp1PWQM`
- Mint: `96kAMgKP59kA1LMdB8zSSZdCRundjEuEUrAbbV8H5DUB`
- Creator: `5pMr4g8pEe2pc5XsKgMnT5e7KCykHXYKm1HEnnBJ4xZE`
- Confirmed creation [transaction](https://explorer.solana.com/tx/iFmYcYf4Hphu36LcLh5CkX4FJpM2wzTJMaPp1CFw3bY8fxPb8geMsKZx8LvtUFeoXZ7Ez9wNNBzYrC6DUKaTQtT?cluster=devnet): `iFmYcYf4Hphu36LcLh5CkX4FJpM2wzTJMaPp1CFw3bY8fxPb8geMsKZx8LvtUFeoXZ7Ez9wNNBzYrC6DUKaTQtT`
- `verifyPoolLaunch` accepted the pool PDA, pool/config/mint/creator relationship, creator and mint signatures, and the DBC `initializeVirtualPoolWithSplToken` instruction. It decoded `Cabal Prime`, `CPRIME3` and the metadata URI from that confirmed instruction.
- The verifier was called directly for this check. This third-party pool was **not** registered in Toluva's launch registry.

## Next proof

Use the normal creator UI with an injected Solana wallet and a public HTTPS metadata JSON URI. Record the creator-paid config signature, pool signature, config/mint/pool addresses, wallet-signed buy and sell signatures, account data and public page. Continue through DBC completion and DAMM v2 migration before claiming the full lifecycle is proven.

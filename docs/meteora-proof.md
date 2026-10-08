# Toluva Conviction devnet proof

This records the first Toluva-owned Meteora DBC pilot launched through the ordinary creator UI. A step is marked complete only after on-chain confirmation. The prior Raydium/Torque proof is separate.

## Pilot identity

- Name: Toluva Conviction Devnet
- Symbol: `TOLUVADEV`
- Network: Solana devnet
- [Public token metadata](https://cdn.jsdelivr.net/gh/Pavilion-devs/toluva-torque@8bc0ef6b6bce0dc4f3e46a28e7288d593524e796/public/metadata/toluva-conviction-devnet.json)
- Recipe: Conviction v1, SOL quote, 1 SOL migration threshold, 1% DBC fee, 0.3% DAMM v2 fee, 50% of migrated creator liquidity permanently locked

## Confirmed config

- Creator/fee claimer/leftover receiver: `Dc12XGCWDcnxpjDsYuz89vFqYJ4YHxYb3dvGFBC22MdL`
- [DBC config](https://explorer.solana.com/address/HtBivi8K1mfroTVMZWGA4bg6uXuBo4c61KJ3mQGXBsWt?cluster=devnet): `HtBivi8K1mfroTVMZWGA4bg6uXuBo4c61KJ3mQGXBsWt`
- [Confirmed createConfig transaction](https://explorer.solana.com/tx/534UTyVGR1LbCtiP5PThtHAEJ5cZnvu7y7LrymsFYTw6fPPy6L2reZMewgqmZbHvF9HtkxRDpAQXHiiUFPZt4iEb?cluster=devnet): `534UTyVGR1LbCtiP5PThtHAEJ5cZnvu7y7LrymsFYTw6fPPy6L2reZMewgqmZbHvF9HtkxRDpAQXHiiUFPZt4iEb`
- The SDK decoded the confirmed config with a 1,000,000,000 lamport threshold, 6 token decimals, fixed supply, immutable token authority, 100 bps DBC fee, 30 bps migrated-pool fee, and the 50/50 creator liquidity split.
- The exact on-chain account bytes are stored as a [regression fixture](../tests/fixtures/devnet-conviction-config.json). The verifier compares the account against the recipe before pool creation.

## Confirmed pool and mint

- [Token mint](https://explorer.solana.com/address/4eRL2sk1EUdAi3YuBDfqT2xx46X5WFpN7N3xmN9QSDtj?cluster=devnet): `4eRL2sk1EUdAi3YuBDfqT2xx46X5WFpN7N3xmN9QSDtj`
- [DBC pool](https://explorer.solana.com/address/DFxmgj3i6rRsf1p13FxuvKELZ3Ktk5MVGLNcKPu8Kbaa?cluster=devnet): `DFxmgj3i6rRsf1p13FxuvKELZ3Ktk5MVGLNcKPu8Kbaa`
- [Confirmed pool transaction](https://explorer.solana.com/tx/2i38qMtv5ziBBvrTTEXxyDPz4EP8Q5zjqxBxrgN7mJWq7CFU1VjqKLrSyrUv3Cg83K1WN95EDX5vyUCVbuTwMzZA?cluster=devnet): `2i38qMtv5ziBBvrTTEXxyDPz4EP8Q5zjqxBxrgN7mJWq7CFU1VjqKLrSyrUv3Cg83K1WN95EDX5vyUCVbuTwMzZA`
- The verifier checked the pool PDA, its on-chain config/mint/creator relationship, creator and mint signatures, and the `initializeVirtualPoolWithSplToken` instruction in that transaction. The instruction metadata matches the name, symbol and URI above.
- Before the first trade, an on-chain status read showed bonding state, zero quote reserve, zero migration progress and 0.00% of the 1 SOL threshold. A read-only exact-input quote for a 0.001 SOL buy returned successfully.
- An unsigned 0.001 SOL buy built for the connected wallet simulated on devnet with no error (46,941 compute units) before wallet signing.
- The public Toluva launch page displays the mint, pool, config, creator, fees, migration target, lock terms, live progress and explorer links. It is currently served by the local development app; this record does not claim that `toluva.xyz` hosts the new build.

![Toluva devnet token page with live DBC terms and a reviewed buy quote](meteora-devnet-launch.png)

## Confirmed first buy

- [Finalized DBC buy transaction](https://explorer.solana.com/tx/29XnbAi5CexW8zEJMZ9KGedCrhf8Mmv3i5Pvffwebfdv6ZvjYmcUUjN1NaJY2dbZbHANwby3eUNeZSVrksuUHpHa?cluster=devnet): `29XnbAi5CexW8zEJMZ9KGedCrhf8Mmv3i5Pvffwebfdv6ZvjYmcUUjN1NaJY2dbZbHANwby3eUNeZSVrksuUHpHa`
- The connected creator wallet `Dc12XGCWDcnxpjDsYuz89vFqYJ4YHxYb3dvGFBC22MdL` signed the transaction. It succeeded at slot `508861735` with no transaction error and invoked the Meteora DBC program against this pool and mint.
- The pool received `0.001` SOL in its quote token account. The wallet's TOLUVADEV token account received `3,158,618.081245` tokens, exactly matching the reviewed output. The transaction fee was `80,000` lamports; token-account creation and other network costs can also affect the wallet's SOL balance.
- A fresh pool read showed `990,000` quote-reserve lamports after fees, `0.10%` graduation progress and migration progress `0` (still bonding). This is buy execution evidence, not graduation evidence.

![Toluva token page showing the confirmed DBC buy and updated progress](meteora-devnet-trade.png)

## Next evidence

- Wallet-signed DBC sell: pending.
- DAMM v2 migration and position state: pending.
- Verified campaign and reward evidence: pending.

The lifecycle reader currently reports this pilot as `bonding`, with `990,000` quote-reserve lamports against the `1,000,000,000` lamport graduation target. It derives prospective DAMM v2 pool `3PUTDKRphNrbXw8MtVa1HvFBGek2fS6NEDM1tyZogbsj` from the on-chain DBC config, mint and Meteora's fee-option mapping. That address has not been created yet. The migration build endpoint correctly rejects this pool as ineligible. A separate SDK build, never signed or submitted, produced a 1,139-byte migration transaction with the expected DBC instruction, DAMM v2 pool/config accounts and two position NFT signers. This confirms transaction construction and account mapping only; the migration and post-migration reader still need a live end-to-end proof.

The normal trade UI reviewed a `1.009101011` SOL graduation buy. Its unsigned transaction simulated without error against the current devnet state. The simulated post-transaction DBC account had exactly `1,000,000,000` quote-reserve lamports, migration progress `2` (`LockedVesting`) and `isMigrated = 0`. This is a predicted post-state, not an executed buy. The reviewed quote screenshot is [graduation-quote-review.png](graduation-quote-review.png).

The first pool build attempt exposed a schema mapping error: the SDK builder accepts nested `migratedPoolFee`, while decoded on-chain `PoolConfig` stores `migratedPoolFeeBps` at the top level. The confirmed config was unaffected. The reader now uses the on-chain field, and an unsigned pool transaction using this config passed devnet simulation before the successful wallet-signed launch.

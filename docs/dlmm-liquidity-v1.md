# Conviction liquidity: DLMM devnet pilot

Toluva offers an optional DLMM pool after a registered DBC launch has graduated to a verified DAMM v2 pool. The DBC migration still ends in DAMM v2. No liquidity is moved from DAMM v2 to DLMM automatically.

## User path

1. The launch creator reviews the current DAMM v2 spot price and Meteora devnet DLMM preset on the graduated launch page. Their wallet pays for and signs the empty DLMM pool creation transaction. If the expected pool already exists, this step is skipped.
2. The creator signs a five-minute message binding the devnet network, DBC pool, token mint, DLMM pool and creator wallet. Toluva verifies both that signature and the derived on-chain pool before storing the one-time link. If pool creation succeeds but linking fails, the creator can return and link the existing pool.
3. Any connected wallet can review a new 21-bin spot position centered on the active bin and enter both launch tokens and SOL. The browser creates the position signer locally. Its wallet signs the deposit transaction; Toluva never receives the position secret key.
4. The page reads the connected wallet's positions from Meteora. The owner can review a full withdrawal that removes all liquidity, claims fees and closes the position. The wallet signs every transaction the SDK requires. A partial sequence is reported with the confirmed transaction link so the user can refresh before another attempt.

This is a liquidity tool, not a funded reward or guaranteed yield. Position value changes with the token price, fees depend on trades, and creating a position uses network rent and fees. The page does not infer that an empty DLMM pool represents useful market depth.

## On-chain and code constraints

- Devnet only, using the official `@meteora-ag/dlmm` SDK pinned in `package.json`.
- Toluva's Conviction recipe has a six-decimal launch token and nine-decimal wrapped SOL. The DLMM service verifies both mints and decimal counts before building position transactions.
- Pool address is derived from the launch mint, wrapped SOL and selected devnet liquidity-mining preset. Its initial active bin is computed from the verified DAMM v2 `sqrtPrice`; price orientation is checked against the launch mint.
- The server builds unsigned transactions and checks the connected wallet owns a position before preparing withdrawal. The browser checks wallet fee payer, required signer and DLMM program before asking for signatures.
- A link message alone cannot register a pool: the pool must already be on chain, owned by the devnet DLMM program and paired with the registered mint and wrapped SOL.
- File-backed registry links are serialized through the existing registry update path. The optional Supabase read/update path should be made atomic before using it for a high-volume deployment.

## Evidence and release gate

As of 2026-10-13, the [public devnet launch page](https://devnet.toluva.xyz/launches/TOLUVADEV-4ERL2SK1EUDAI3YUBDFQT2XX46X5WFPN7N3XMN9QSDTJ) is deployed. The creator signed the [DLMM pool creation transaction](https://explorer.solana.com/tx/LDeGUTVbLNUZkA3tUWYoxbaM6SUhjpX5YnYSXvhfQCm3tmi8E3yquwaDkwxamvn3Jf1ScqxnZtoZ7VWQqGzQSGJ?cluster=devnet), which finalized at slot `510423819` without error; the public API verifies the expected TOLUVADEV/SOL pool and its signed link. Unit tests cover price orientation, amount precision and creator-signed linking; the API and web build pass. The existing three launches and persisted creator-wallet 2/2 Conviction proof survived deployment. **No deposit or withdrawal has yet been signed and confirmed.** Do not present the full liquidity path as on-chain completion proof until those transactions and the resulting position are independently checked.

For the remaining live pilot: deposit a small amount from a wallet with TOLUVADEV and devnet SOL, verify position balances and bin range on chain, then withdraw and verify the position closed and assets returned. Record every signature and exact pool/position address in `docs/meteora-proof.md`. Repeat with an independent wallet before claiming external usage. Keep funded rewards on the separate gate in `docs/conviction-rewards-plan.md`.

The production dependency audit currently reports 18 advisories (7 moderate, 11 high), including transitive issues in the Solana/Meteora SDK tree. Review compatible upstream fixes and the reachable attack surface before any mainnet or funded release; this devnet pilot is not a security audit.

References: [Meteora DLMM SDK examples](https://docs.meteora.ag/developer-guides/dlmm/typescript-sdk/examples), [DLMM SDK reference](https://docs.meteora.ag/developer-guides/dlmm/typescript-sdk/reference).

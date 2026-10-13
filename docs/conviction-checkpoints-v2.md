# Conviction checkpoints v2

This is Toluva's public, unfunded Conviction leaderboard for registered Meteora DBC launches. It scores a verified DBC buy and two stored post-migration token-balance observations. It makes no claim that a wallet held continuously between observations. No payout or claim is available.

## Fixed policy

The implementation source of truth is `CONVICTION_PROOF_POLICY` in `server/services/conviction-proof.js`.

| Rule | Value |
| --- | --- |
| Policy ID | `conviction-checkpoints-v2` |
| Entry transaction | One finalized Meteora DBC `swap2` buy in the exact launch pool, signed by the buyer wallet and submitted by signature for server verification |
| Minimum entry buy | 10,000,000 lamports of SOL quote added to the DBC vault (0.01 SOL) |
| Graduation | The successor DAMM v2 pool must verify on chain before balance observations start |
| Entry checkpoint | First successful finalized balance observation after verified migration, recorded once |
| Follow-up checkpoint | First successful finalized balance observation at least 86,400 chain seconds after entry, recorded once |
| Balance threshold | At least 1 token (1,000,000 base units for the six-decimal Conviction recipe) across the wallet's token accounts at **each** checkpoint |
| Score | One point per passing checkpoint, maximum two; eligible proof requires both points |
| Reward | None funded or claimable |

The server samples active launches every five minutes and also samples when anyone opens the public leaderboard. It stores each checkpoint with the wallet, mint, pool, policy ID, raw balance, token-account addresses, finalized slot, and that slot's chain timestamp. A checkpoint cannot be rewritten or backdated. If the server or RPC is unavailable, the next successful observation is used. The elapsed window begins at the first stored observation, so downtime cannot create a fictional historical balance. A second observation below the threshold remains failed even if the wallet later tops up.

The leaderboard shows the qualifying buy transaction, both checkpoint readings, slots, token account links, score, and eligibility status. Buy signatures and observations are idempotent. A repeated buy, sell, client-supplied event, or wrong-pool transaction cannot add points. The previous [live checkpoint v1](conviction-proof-v1.md) remains documented as a historical experiment; it is not retroactively treated as a v2 entry observation.

## Coverage and limits

Trade evidence is opt-in: Toluva verifies finalized transaction signatures submitted through its trade flow. This is not a complete market index. The current scan considers at most 500 recent verified swap receipts and the first 50 qualifying wallets; the API marks results incomplete when these limits are reached. The Supabase observation query currently supports fewer than 1,000 observations per pool. Pagination and a comprehensive indexing source are required before a high-volume or funded campaign. The file-backed store persists locally, but a public deployment needs durable storage and a reliable RPC.

Two points prove only the two observed balances, not continuous holding, identity uniqueness, lack of wash trading, or entitlement to funds. A funded campaign needs independent participant testing, a complete event index, published reward economics, Sybil limits, and a verified payout path.

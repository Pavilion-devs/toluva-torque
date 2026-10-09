# Graduation checkpoint v1

This is a public, unfunded Conviction proof for each registered Meteora DBC launch. It answers a narrow question: which tracked wallets made a meaningful DBC buy and still hold the token at the current finalized chain snapshot after migration? It is not a funded reward campaign or a claim of uninterrupted holding.

## Fixed policy

The implementation source of truth is `CONVICTION_PROOF_POLICY` in `server/services/conviction-proof.js`.

| Rule | Value |
| --- | --- |
| Policy ID | `graduation-checkpoint-v1` |
| Buy evidence | One finalized Meteora DBC `swap2` buy in the launch's pool, submitted by transaction signature and verified by Toluva |
| Minimum buy | 10,000,000 lamports of SOL quote added to the DBC vault (0.01 SOL) |
| Graduation | The launch's successor DAMM v2 pool must verify on chain |
| Current balance | At least 1 token (1,000,000 base units for the Conviction recipe) across the wallet's token accounts, read at finalized commitment |
| Score | One point per wallet meeting the checkpoint, independent of repeat buys or volume above the minimum |
| Reward | None funded or claimable in this version |

The result includes each wallet's qualifying buy signature and slot, the current token amount, token account addresses and balance-read slot. Replayed signatures are stored once. Buys below the minimum and sells do not add points. A wallet may change its balance after a read, so the page shows when the check ran and refreshes it. The current balance check does not prove that the same tokens were held continuously or that the wallet did not trade through other venues.

## Coverage and next gate

The tracked set contains finalized signatures submitted to Toluva. Public Solana RPC address-history queries can omit confirmed transactions, as observed with the pilot's first buy, so this checkpoint is an opt-in proof set rather than a complete market index. The result reports when its capped scan is incomplete. The pilot currently has two verified buys by one wallet; its 1.009101011 SOL graduation buy and current token balance meet these proof rules.

Before any funded campaign, add durable indexing and an independently testable observation window, verify two-wallet participation, publish funding and payout rules, and audit anti-farming limits. If rewards use Torque, verify its current network and claim path separately. Do not reuse this live checkpoint as a retroactive uninterrupted-hold attestation.

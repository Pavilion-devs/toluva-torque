# Conviction rewards: funding and claim gate

Toluva currently proves participation under `conviction-checkpoints-v2`. It does not fund or pay rewards. The next product step is a small devnet campaign that lets an independent eligible wallet claim a real distribution, with every state backed by an inspectable transaction.

## Product contract

1. A creator publishes the campaign's exact pool, mint, network, policy version, qualifying window, reward asset, total budget, per-wallet allocation rule, maximum winners, and claim window **before** participation begins.
2. A verified DBC buy and two finalized post-migration balance observations determine whether a wallet meets the fixed policy. Those snapshots do not prove continuous holding or distinct human identity. The UI must say so.
3. A campaign remains **proof only** until a distribution provider or escrow confirms the full budget on chain. An estimate, admin promise, database flag, or unsigned transaction is not funding.
4. After the observation window, freeze an auditable wallet/allocation list and publish its hash. A creator reviews this list and authorizes distribution. The claim page becomes active only when funding, the frozen list, and provider claim instructions all verify.
5. The participant signs the claim transaction. Toluva then reads its finalized receipt and records the actual reward received. Reopening the page cannot create a second entitlement or claim.

The visible states are `Proof only`, `Funding pending`, `Funded, waiting for final results`, `Claim open`, `Claimed`, and `Claim closed`. Each state needs a public reason and a transaction or provider link where one exists. The current public product stays at **Proof only**.

## Implementation route

Evaluate Torque first because the prior Toluva project has Torque integration history and [Torque documents custom qualification queries, approved epochs, claim distribution, and API/SDK integration](https://docs.torque.so/overview/how-it-works). This documentation shows product capabilities, not that the current Toluva project has a funded campaign or that Torque indexes Meteora DBC swaps and Toluva's two checkpoints. Confirm those exact capabilities in a small devnet test before depending on them.

The test must prove:

- The active Torque project/account is accessible with new server-only credentials; the old Raydium event IDs and incentives are not treated as Meteora proof.
- Qualification is sourced from verified transactions and immutable checkpoint observations. A client-submitted custom event cannot add or alter eligibility.
- The previewed wallet list and amounts match Toluva's published policy, including the 24-hour rule, and are frozen for a single campaign epoch.
- The configured reward asset, full budget, fees, funding transaction, claim window, participant-signed claim, and finalized payout are all inspectable.
- A forged event, repeated signature, second claim, wrong pool, wrong mint, or late balance observation cannot create a payout.

If Torque cannot satisfy these checks for this DBC lifecycle, select a reviewed on-chain distributor with funded escrow and wallet-signed claims. A server hot wallet sending rewards on demand is not an acceptable substitute. Do not implement a custom payout program without a separate security review.

## Data and fairness gates

The current activity feed verifies finalized signatures **submitted to Toluva**; it is not a complete index of every swap in the DBC pool. A funded campaign needs either a complete, reconciled chain index or a plainly disclosed rule limiting eligibility to trades submitted through Toluva. For a general launchpad, complete indexing is the stronger path. The current file store caps activity and observation reads, so pagination and durable storage are also required before scaling or funding.

Use an independent creator wallet and at least two independent participant wallets for the devnet claim pilot. Record the config, pool, migration, both checkpoints, allocation snapshot, funding, and each claim in the [proof record](meteora-proof.md). Keep the devnet budget small, then review provider, custody, fees, failure recovery, abuse limits, and deployment durability before any mainnet reward.

## Decisions required before funding

- Reward asset, total budget, per-wallet cap, and who funds it.
- Whether reward eligibility includes every verified pool trade or only trades submitted through Toluva.
- Distribution provider and claim-window length after its devnet test.
- How the campaign treats Sybil wallets and concentration; two checkpoints alone do not solve either problem.

No UI should display a claim button, claimable amount, or funded badge until these decisions are fixed and the funding receipt is verified.

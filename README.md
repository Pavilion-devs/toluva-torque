# Toluva × Meteora

Toluva is becoming a self-service Meteora DBC launchpad. A creator can review a launch recipe, sign a DBC config and token pool with their own Solana wallet, and publish an on-chain launch record. The first recipe, **Conviction v1**, uses a SOL quote and targets DAMM v2 graduation.

This repository began as Toluva's Raydium LaunchLab + Torque hackathon project. Its original [README](docs/torque-original-readme.md), [plan](docs/torque-original-plan.md) and [devnet proof](docs/devnet-proof.md) are retained as prior-work records. They are not evidence of a Meteora launch. The current [build plan](plan.md) and [economic specification](docs/conviction-v1.md) identify the new work.

## Current state

- The Meteora DBC SDK is pinned at `1.5.13` and the Conviction config passes SDK validation at supported graduation targets.
- The API builds unsigned config and pool transactions. The browser generates the extra signers, and the connected wallet signs both transactions.
- Pool registration checks a confirmed DBC pool, its derived address, creator and mint signatures, and the specific pool creation instruction. Name, symbol and URI are decoded from that instruction.
- The public launch page reads live DBC progress and on-chain config terms. The creator can resume after a confirmed config or retry registration after a confirmed pool.
- Exact-input DBC quote and buy/sell transaction builders are wired to a wallet-signed trade card with slippage and minimum-received review. Two wallet-signed buys completed the first pilot curve; a second active curve has a confirmed buy and sell. A later buy on the public site validated the deployed trade path.
- The creator-signed config, token pool, buys, sell and DAMM v2 migration are [confirmed on chain](docs/meteora-proof.md). The live page reads the graduated pool, creator position NFT, fee and permanent liquidity lock. It verifies submitted swap signatures against finalized DBC transactions and displays tracked participation. The [unfunded Conviction leaderboard](docs/conviction-checkpoints-v2.md) recorded two post-migration balance checkpoints 86,423 chain seconds apart for the creator wallet. Independent wallet participation remains in the [plan](plan.md).
- The launch form publishes wallet-approved, content-addressed metadata and artwork through [public storage](docs/metadata-hosting.md). The Toluva Genesis launch used this path on [devnet.toluva.xyz](https://devnet.toluva.xyz); its JSON and artwork are public. Creators can also supply an existing HTTPS metadata URI.

## Run locally

Use Node 20 or newer. With Node 24:

```bash
npm ci
npm run dev
```

The frontend runs on port 5173 and the API on port 8787. Run `npm test` for the economic config checks and `npm run build` for the production frontend build.

For a public deployment, serve the web app and API on one HTTPS origin or set `VITE_TOLUVA_API_URL` when they use separate origins. Configure `SOLANA_CLUSTER=devnet` and `SOLANA_RPC_URL` for the API; set `VITE_SOLANA_RPC_URL` to an RPC for the same cluster. The launch flow currently rejects non-devnet pool/config creation. Supabase remains optional locally; a persistent public registry needs the updated [schema](scripts/supabase-schema.sql) with the `dbc` column. A Docker layout for the shared TierHive VPS is in [the TierHive deployment guide](docs/tierhive-deploy.md).

Creators need a Solana browser wallet and devnet SOL for account rent and fees. They can use Toluva-hosted metadata when storage is configured, or supply a public HTTPS token JSON URI. Toluva does not hold creator keys or silently substitute a demo wallet.

## Next integration gates

1. Have an unaffiliated creator complete the normal devnet launch, and an independent participant test buy/sell and verify public activity using the [pilot guide](docs/independent-devnet-pilot.md).
2. Improve RPC reliability, monitoring and durable storage before relying on the public service for a funded campaign.
3. Complete a two-wallet Conviction observation and design a funded reward claim only after the verified proof and payout path are reviewed.

See [plan.md](plan.md) for exit criteria and evidence standards.
For the current public devnet host, use the [TierHive deployment guide](docs/tierhive-deploy.md); preserve the metadata volume and API hostname because launched tokens already point to these public URIs.
The [read-only devnet validation record](docs/meteora-readonly-validation.md) distinguishes third-party pool checks from a Toluva-owned launch.
The [Meteora friction log](docs/meteora-friction-log.md) records integration failures, root causes and fixes from the live creator flow.

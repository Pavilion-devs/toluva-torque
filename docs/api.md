# Toluva Meteora API

The Node API builds unsigned Meteora DBC transactions, reads chain state and records confirmed launches. The browser holds generated signer keys and the connected wallet signs. New DBC launch records are verified on chain before publication.

Run locally with `npm run api` (port 8787), or run the API and web app together with `npm run dev`. Set `SOLANA_CLUSTER=devnet` and `SOLANA_RPC_URL` for the server, and point `VITE_SOLANA_RPC_URL` at the same cluster in the browser. Set `VITE_TOLUVA_API_URL` to the deployed API origin for public builds. The API uses a local file registry unless Supabase is configured; public deployments need persistent storage and the updated [schema](../scripts/supabase-schema.sql).

## Current routes

| Route | Purpose |
| --- | --- |
| `GET /api/health` | API liveness. |
| `GET /api/registry` | Public launch registry with live DBC status when chain reads succeed. |
| `GET /api/meteora/terms?migrationThresholdSol=5` | Conviction v1 economics for creator review. |
| `GET /api/meteora/config?address=…` | On-chain config summary. |
| `GET /api/meteora/pool?address=…` | On-chain pool progress, migration state and reserves. |
| `POST /api/meteora/config/build` | Build an unsigned creator-paid config transaction from `{payer, config, migrationThresholdSol}`. The fee claimer and leftover receiver are the payer. |
| `POST /api/meteora/pool/build` | Build an unsigned pool transaction from `{payer, config, baseMint, name, symbol, uri, migrationThresholdSol}` after validating the on-chain config against the disclosed recipe. |
| `POST /api/meteora/launches` | Register `{pool, mint, config, creator, signature}` after verifying the confirmed transaction and on-chain pool. The server decodes name, symbol and URI from the DBC pool-creation instruction. Repeating a valid registration returns the existing record. |
| `GET /api/meteora/swap/quote?pool=…&direction=buy&amount=0.01&slippageBps=100` | Exact-input quote with output estimate and minimum received. `direction` is `buy` or `sell`. |
| `POST /api/meteora/swap/build` | Build an unsigned exact-input swap from `{owner, pool, direction, amount, slippageBps}` using a fresh chain quote. |

`POST /api/meteora/launches` stores the full mint in its route key, allowing duplicate token tickers. A launch page uses the mint, config and pool addresses from the verified record, never a build-time token constant. The public API does not accept caller-supplied trade events as proof of campaign eligibility.

Prior Raydium and Torque routes are retained in source for migration history but return `410` by default. Set `TOLUVA_LEGACY_API_ENABLED=true` only when intentionally running the prior project in an isolated environment. The previous API contract is archived in [torque-original-api.md](torque-original-api.md).

## Current limits

New config, pool and swap builders are devnet-only. Read-only quotes, swap transaction builds and launch verification were exercised against existing devnet pools; a wallet-signed Toluva launch and swap still need live testing. Metadata hosting, migrated DAMM v2 positions, transaction-verified campaign events and payouts are not part of this API yet.

# Toluva Meteora API

The Node API builds unsigned Meteora DBC transactions, reads chain state and records confirmed launches. The browser holds generated signer keys and the connected wallet signs. New DBC launch records are verified on chain before publication.

Run locally with `npm run api` (port 8787), or run the API and web app together with `npm run dev`. Set `SOLANA_CLUSTER=devnet` and `SOLANA_RPC_URL` for the server, and point `VITE_SOLANA_RPC_URL` at the same cluster in the browser. Set `VITE_TOLUVA_API_URL` to the deployed API origin for public builds. The API uses a local file registry unless Supabase is configured; public deployments need persistent storage and the updated [schema](../scripts/supabase-schema.sql).

## Current routes

| Route | Purpose |
| --- | --- |
| `GET /api/health` | API liveness. |
| `GET /api/registry` | Public launch registry with live DBC status when chain reads succeed. |
| `GET /api/meteora/terms?migrationThresholdSol=5` | Conviction v1 economics for creator review. |
| `GET /api/meteora/metadata/status` | Whether public metadata hosting is configured. |
| `POST /api/meteora/metadata/challenge` | Normalize `{name, symbol, description, imageDataUrl, wallet}` and return the exact short-lived message to sign. |
| `POST /api/meteora/metadata/publish` | Verify the wallet message signature, publish content-addressed JPEG/JSON, check public readability and return an HTTPS URI. |
| `GET /metadata/images/…` and `GET /metadata/tokens/…` | Immutable public asset reads when using the persistent API volume backend. |
| `GET /api/meteora/config?address=…` | On-chain config summary. |
| `GET /api/meteora/pool?address=…` | On-chain pool progress, migration state and reserves. |
| `POST /api/meteora/config/build` | Build an unsigned creator-paid config transaction from `{payer, config, migrationThresholdSol}`. The fee claimer and leftover receiver are the payer. |
| `POST /api/meteora/pool/build` | Build an unsigned pool transaction from `{payer, config, baseMint, name, symbol, uri, migrationThresholdSol}` after validating the on-chain config against the disclosed recipe. |
| `POST /api/meteora/launches` | Register `{pool, mint, config, creator, signature}` after verifying the confirmed transaction and on-chain pool. The server decodes name, symbol and URI from the DBC pool-creation instruction. Repeating a valid registration returns the existing record. |
| `GET /api/meteora/swap/quote?pool=…&direction=buy&amount=0.01&slippageBps=100` | Exact-input quote with output estimate and minimum received. `direction` is `buy` or `sell`. |
| `POST /api/meteora/swap/build` | Build an unsigned exact-input swap from `{owner, pool, direction, amount, slippageBps}` using a fresh chain quote. |
| `POST /api/meteora/migration/build` | Build a wallet-signed DAMM v2 migration only when the DBC pool is eligible on chain. |

`POST /api/meteora/launches` stores the full mint in its route key, allowing duplicate token tickers. A launch page uses the mint, config and pool addresses from the verified record, never a build-time token constant. The public API does not accept caller-supplied trade events as proof of campaign eligibility.

Prior Raydium and Torque routes are retained in source for migration history but return `410` by default. Set `TOLUVA_LEGACY_API_ENABLED=true` only when intentionally running the prior project in an isolated environment. The previous API contract is archived in [torque-original-api.md](torque-original-api.md).

## Current limits

New config, pool, swap and migration builders are devnet-only. The Toluva-owned [pilot](meteora-proof.md) verified a config, pool, two buys and DAMM v2 migration with position ownership and locks on chain. Sell execution and transaction-verified campaign events remain open. Metadata hosting requires a configured public storage backend; see [metadata-hosting.md](metadata-hosting.md). The hosting code has been tested with an isolated API and generated wallet signatures but has not yet been used for a signed token launch.

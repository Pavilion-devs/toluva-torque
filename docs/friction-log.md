# Friction Log

This file tracks anything that slows down the Raydium LaunchLab or Torque integration. Keep entries concrete: what failed, where it failed, expected behavior, workaround, and whether it needs sponsor feedback.

## Open

- Raydium reference clones named in `plan.md` are not currently present in `/tmp`: `/tmp/raydium-sdk-V2-demo` and `/tmp/raydium-sdk-V2`.
- Raydium LaunchLab browser signing/submission is wired; next step is running it with a funded injected devnet wallet.
- Dashboard registry pages now start from an empty local API registry. Tables and analytics derive from real local API launch records, Torque event receipts, and Raydium pool IDs only.
- Claim/leaderboard data source still needs confirmation: public landing-page endpoints where possible, backend-authenticated calls where required.
- Torque custom-event fields are required at ingestion time and custom events allow at most 5 string fields. The local catalog now validates this before ingest.
- Recurring incentive `cmp03y0i2029sk01hm3br7vld` is evaluating (May 10 8pm → May 11 9pm). Funding step happens after evaluation ends — Torque prepares the offer then presents the fund option. Pending fund of 0.0105 SOL from wallet `Dc12X...22MdL`.

## Torque Epoch Timezone Bug — Confirmed by Torque Team (feedback for Torque)

- **What failed:** Two consecutive epoch failures with `Cannot create audience: query returned 0 rows. Query status: COMPLETED`.
- **Root cause (confirmed by Torque):** The platform displays times in the user's local timezone (WAT = UTC+1), but epoch evaluation windows are stored and executed in UTC. When the epoch was set up via the platform, the start/end times were shifted by 1 hour relative to when the events were actually ingested. The events landed at e.g. 18:00 UTC but the epoch window was 19:00–20:00 UTC, so 0 rows matched.
- **What made it hard to diagnose:** `preview_incentive_query` run manually returned 1 row of real data for the same event ID and date range — meaning the data existed but the epoch's stored UTC window didn't cover it.
- **Resolution:** Torque team manually corrected the evaluation period and triggered the incentive.
- **Suggestion for Torque:** Show UTC times explicitly alongside local times in the epoch timing UI, or validate that the epoch window actually contains ingested data before confirming creation. A builder with no visibility into this offset will hit the same failure silently every time.

## Torque Funding Flow — Non-Obvious UX (feedback for Torque)

- **Expected:** Fund the incentive upfront before the epoch starts, like a deposit.
- **Actual:** The platform shows no "Fund" or "Deposit" button before or during evaluation. After the evaluation period ends, Torque prepares the offer and only then presents the funding option.
- **Impact:** A builder creating their first incentive via MCP has no indication that funding is a post-evaluation step. The platform shows "0.01 Wallet Connected" in the rewards column with no further instruction, which reads as "already funded."
- **Workaround:** Asked Torque on Telegram. Response: "Once the evaluation period is over the offer gets prepared and you'll be given the option to fund it."
- **Suggestion for Torque:** Add a banner or tooltip on the incentive settings page clarifying that funding occurs after evaluation, not before. The current UI implies funding is a pre-requisite that's been missed.

## Resolved

- Landing page raw HTML source is now local at `references/fintech-saas.aura.build-content.html.txt`; app import path points to the repo-local file without making Vite treat it as an HTML entry.
- Local API + file-backed registry exists, so Raydium and Torque integration can plug into backend-owned routes instead of browser-only static data.
- Torque custom event ingestion is wired behind `POST /api/events`; missing credentials degrade to local receipts instead of blocking dashboard development.
- Torque event request serializer now flattens primitive event fields directly under `data`, matching the ingestion API shape.
- Torque MCP works locally through `server/torque-mcp-wrapper.js` after logging in with `TORQUE_MCP_API_KEY`. The wrapper uses `npx --yes @torque-labs/mcp@latest` so it does not hang on an install prompt.
- Toluva project is selected in Torque: `cmoom7gr80030jr1inh1hm91l`.
- Created, attached, and seeded all 10 Torque custom events through `POST /api/events`; Torque returned `202 ACCEPTED` receipts. First-buy query preview returned wallet `44444444444444444444444444444444` with value `42.5`.
- Local `/api/events` schema validation rejects incomplete events before Torque ingest; `reward_claimed` without `tx_signature` returns `400`.
- Fixed `reward_claimed` to fit Torque's 5-string-field cap by dropping `claim_id` and keeping `tx_signature`.
- Previewed `Toluva Early Buyer Leaderboard Proof`: 0.1 SOL distribution pool, 1 weekly epoch starting `2026-05-04T00:00:00.000Z`, `first_buy_completed` event source, rank formula `RANK == 1 ? TOTAL_REWARD_POOL * 0.3 : RANK <= 3 ? TOTAL_REWARD_POOL * 0.15 : RANK <= 10 ? TOTAL_REWARD_POOL * 0.4 / 7 : 0`. Torque preview displayed protocol fee `+0.01` and total pay `0.11`.
- Raydium SDK dependencies are installed: `@raydium-io/raydium-sdk-v2`, `@solana/web3.js`, and `@solana/spl-token`.
- Raydium LaunchLab program IDs and launch-prep parameters are backend-configurable; current docs default devnet to `DRay6fNdQ5J82H7xV6uq2aV3mNrUZ1J4PgSKsWgptcm6`.
- Verified Raydium devnet LaunchLab accounts exist: platform `2Jx4KTDrVSdWNazuGpcA8n3ZLTRGGBDxAWhuKe2Xcj2a`, config `7ZR4zD7PYfY2XxoG1Gxcy2EgEeGYrpxrwzPuwdUBssEt`.
- Added `POST /api/raydium/launches/transaction-plan` to validate LaunchLab raw-unit inputs and derive `auth`, `poolId`, `vaultA`, `vaultB`, and `configId` while keeping creator/mint private keys client-side.
- Added `POST /api/raydium/launches/build-transaction`; SDK verification produced one unsigned base64 V0 transaction with creator wallet and mint public key as required signers.
- Added dashboard `/dashboard/launches` signing flow: the browser generates the mint keypair, signs the transaction with that mint keypair, asks the injected wallet for the creator signature, submits to devnet, records the launch, and emits `token_launch_created`.
- `GET /api/raydium/launchlab/status?poolId=...` now attempts live LaunchLab pool decoding from the configured RPC.
- `New launch` no longer toggles the form closed when clicked repeatedly; the form has an explicit `Close` button, submission state, and a clear demo-wallet warning.
- Dashboard chrome now shows `API data` versus `API offline`, and Launches shows whether it is using the local API file registry.
- Removed the seeded demo launches/campaigns/activity/analytics from `data/launch-registry.json`; `npm run dev` now starts API + web together.
- Phantom blocked the first LaunchLab signing attempt because simulation failed before wallet signing. Reproducing the generated transaction against devnet showed `AccountNotFound` when the fee-payer wallet has no devnet account/SOL. Added frontend preflight to check devnet wallet existence, minimum devnet SOL, and transaction simulation before opening Phantom.
- Runtime registry now defaults to ignored `data/local-launch-registry.json`; committed `data/launch-registry.json` stays empty. The first successful devnet proof is documented in `docs/devnet-proof.md`.
- Added Raydium buy transaction builder plus Launches-table `Buy 0.01 SOL` action. Successful buys submit to devnet and emit `first_buy_completed`/`buy_completed` through Torque.

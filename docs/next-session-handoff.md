# Toluva Next Session Handoff

Use this file when continuing Toluva in a fresh Codex session where the Torque MCP server is available.

## Project

Toluva is an incentive-native Raydium LaunchLab launchpad. The goal from `plan.md` is:

- let creators launch tokens through Raydium LaunchLab;
- attach Torque incentives from day one;
- emit measurable launch/trader/community events;
- show launch/campaign/analytics state in the existing UI;
- document Torque/Raydium friction for sponsor feedback.

Do not redesign the UI unless a backend/API contract makes a tiny change unavoidable.

## Current Repo State

Repo path:

```text
/Users/favourolaboye/Downloads/claude-code/frontier/tracks/torque
```

GitHub remote:

```text
https://github.com/Pavilion-devs/toluva-torque.git
```

Important commits already pushed:

- `7bb342b Initial Toluva launchpad scaffold`
- `35d574b Add Torque MCP wrapper`
- `d1e5d55 Avoid localhost registry fetch in static deploys`
- `dd8b0e3 Add Vercel SPA rewrites`

Frontend is deployed on Vercel and the dashboard route now works because `vercel.json` rewrites SPA routes to `index.html`.

## Secrets

Never commit secrets.

Local secrets live in `.env`, which is gitignored:

- `TORQUE_EVENT_API_KEY`: Event ingestion key from the Torque Developer page.
- `TORQUE_MCP_API_KEY`: JWT MCP token from `https://platform.torque.so/connect-mcp`.

`TORQUE_API_KEY` is intentionally left blank in `.env` to avoid mixing the event ingestion key and MCP token.

The MCP wrapper maps `TORQUE_MCP_API_KEY` to `TORQUE_API_KEY` only for the Torque MCP process:

```text
server/torque-mcp-wrapper.js
```

Repo-safe MCP config shape:

```text
.mcp.example.json
```

Real local MCP config:

```text
.mcp.json
```

`.mcp.json` is gitignored.

## Current MCP Status

Latest session update:

- Local `.mcp.json` now points at `server/torque-mcp-wrapper.js`.
- `server/torque-mcp-wrapper.js` uses `npx --yes @torque-labs/mcp@latest` to avoid noninteractive install prompts.
- Torque MCP login succeeded with `TORQUE_MCP_API_KEY`.
- Active Torque project: `Toluva` (`cmoom7gr80030jr1inh1hm91l`).
- Attached custom events:
  - `token_launch_created`: `cmooyf504003tjr1isr8cdwfs`
  - `referral_clicked`: `cmooyn6xe004hjr1i2qz28y4p`
  - `wallet_connected_to_launch`: `cmooyn7f2004pjr1inoizjhj2`
  - `first_buy_completed`: `cmooypi8b0051jr1i49g8jaes`
  - `launch_page_shared`: `cmop0m6gy006djr1i0wnhmanx`
  - `buy_completed`: `cmop0m6s3006ljr1imt72c4f8`
  - `migration_threshold_hit`: `cmop0m75f006tjr1isv294vdh`
  - `token_migrated`: `cmop0m7ge0071jr1isw5nk7c7`
  - `reward_claim_started`: `cmop0m7yi0079jr1itdmj9opv`
  - `reward_claimed`: `cmop0m8rs007hjr1iasftm4p9`
- Seeded all 10 through `POST /api/events`; Torque returned `202 ACCEPTED`.
- `/api/events` now validates required event fields locally before Torque ingest. `reward_claimed` was adjusted to drop `claim_id` and keep `tx_signature` so it fits Torque's 5-string-field cap.
- Generated and previewed the `first_buy_completed` query using `SUM(amount_usd)`. Preview returned `44444444444444444444444444444444,42.5`.
- Previewed, but did not confirm, `Toluva Early Buyer Leaderboard Proof`: 0.1 SOL pool, weekly, one epoch, start `2026-05-04T00:00:00.000Z`, formula `RANK == 1 ? TOTAL_REWARD_POOL * 0.3 : RANK <= 3 ? TOTAL_REWARD_POOL * 0.15 : RANK <= 10 ? TOTAL_REWARD_POOL * 0.4 / 7 : 0`. Torque preview displayed fee `+0.01` and total pay `0.11`.
- Raydium devnet platform/config were resolved and verified on-chain:
  - platform: `2Jx4KTDrVSdWNazuGpcA8n3ZLTRGGBDxAWhuKe2Xcj2a`
  - config: `7ZR4zD7PYfY2XxoG1Gxcy2EgEeGYrpxrwzPuwdUBssEt`
- Raydium backend now has `POST /api/raydium/launches/transaction-plan`, `POST /api/raydium/launches/build-transaction`, and live `GET /api/raydium/launchlab/status?poolId=...` pool decoding. SDK verification produced one unsigned base64 V0 transaction with creator wallet and mint keypair as required signers.
- Dashboard `/dashboard/launches` now has a `New launch` panel that performs the client-side devnet submission: generate mint keypair, call `build-transaction`, sign with mint keypair, ask injected wallet to sign, submit to devnet, create the local launch record, and emit `token_launch_created`. This needs a funded injected devnet wallet; the demo wallet cannot sign.
- `New launch` now opens the form without toggling it closed, and the form shows explicit close/submitting/error/success states.
- Dashboard chrome shows `API data` versus `API offline`; Launches also shows whether it is using the local API file registry.
- `data/launch-registry.json` now starts empty. Dashboard tables/analytics derive from real local API records, Torque event receipts, and Raydium pool IDs only.
- Runtime registry writes default to ignored `data/local-launch-registry.json`; committed `data/launch-registry.json` is an empty seed baseline.
- First successful devnet proof is documented in `docs/devnet-proof.md`.
- `npm run dev` now starts API + web together. Use `npm run dev:web` only when intentionally running the frontend without the API.
- Phantom signing failure root cause found: the generated devnet transaction reaches Phantom, but Phantom blocks when simulation fails. Reproduction against devnet returned `AccountNotFound` for an unfunded/nonexistent fee-payer account. Frontend now checks that the connected wallet exists on devnet, has at least 0.05 devnet SOL, and that the transaction simulates before calling `provider.signTransaction`.
- Launches table now reads live Raydium pool status from `GET /api/registry` enrichment and has a real `Buy 0.01 SOL` action for pool-backed launches. Successful buys call `POST /api/raydium/launches/build-buy-transaction`, submit the wallet-signed devnet transaction, then emit `first_buy_completed` or `buy_completed` through `POST /api/launches/:sym/buy-events`.

The previous session registered Torque with Codex:

```bash
codex mcp add torque -- node /Users/favourolaboye/Downloads/claude-code/frontier/tracks/torque/server/torque-mcp-wrapper.js
```

In the new session, the user reported Torque tools are visible:

```text
ask_torque
attach_custom_event
auth
create_api_key
create_custom_event
create_idl
create_instruction
create_project
create_recurring_incentive
generate_incentive_query
get_ai_context
get_epoch_aggregate_stats
get_epoch_leaderboard
get_recurring_incentive
list_api_keys
list_custom_events
list_idls
list_projects
list_recurring_incentives
preview_incentive_query
register_dune_event_source
reset_context
set_active_project
```

First action in the new session should be to confirm MCP auth and active project.

## Backend/API Status

Local API:

```bash
npm run api
```

All-in-one dev server:

```bash
npm run dev:all
```

Important API routes:

- `GET /api/health`
- `GET /api/registry`
- `GET /api/integrations/status`
- `GET /api/torque/event-schemas`
- `POST /api/events`
- `GET /api/raydium/launchlab/status`
- `POST /api/raydium/launches/prepare`

The frontend defaults `VITE_TOLUVA_API_URL` to `http://127.0.0.1:8787` locally. If the API is unavailable, dashboard views fall back to an empty registry and show `API offline`; they no longer show fake launch/campaign rows.

## Verification Already Done

Commands that passed:

```bash
npm run build
```

Known build warning:

```text
Some chunks are larger than 500 kB after minification.
```

This is non-blocking for now.

The local registry starts empty:

```json
{
  "launches": 0,
  "campaigns": 0,
  "liveEvents": 0,
  "eventReceipts": 0
}
```

## Torque Event Pipeline Status

`POST /api/events` now:

- normalizes local events into Torque's custom-event ingestion shape;
- sends to `https://ingest.torque.so/events` when `TORQUE_EVENT_API_KEY` is present;
- records `torqueRequest`, `torqueReceipt`, `torqueError`, and `status`;
- degrades gracefully when credentials are missing.

Earlier real ingestion test reached Torque but failed with:

```text
Event not found for this API key
```

This is the current expected blocker. It means the event key works well enough to reach Torque, but the custom event schema is not created/attached in the Toluva project yet.

The serializer was corrected after an earlier schema issue. Event fields are now flattened under `data` instead of nested inside `data.payload`.

Example generated Torque request:

```json
{
  "userPubkey": "11111111111111111111111111111111",
  "timestamp": 1777745025452,
  "eventName": "token_launch_created",
  "data": {
    "source": "toluva",
    "amount": 1,
    "verified": true,
    "token": "TOLUVA_DEMO",
    "launch_id": "demo-launch"
  }
}
```

## Torque Event Catalog

Canonical local catalog:

```text
server/services/torque-event-catalog.js
```

Runtime route:

```text
GET /api/torque/event-schemas
```

Events to create/attach:

1. `token_launch_created`
2. `launch_page_shared`
3. `referral_clicked`
4. `wallet_connected_to_launch`
5. `first_buy_completed`
6. `buy_completed`
7. `migration_threshold_hit`
8. `token_migrated`
9. `reward_claim_started`
10. `reward_claimed`

## Next Session Task Order

### 1. Confirm MCP Context

Use Torque MCP tools:

1. `auth({ action: "status" })`
2. `list_projects()`
3. Find/select the Toluva project.
4. `set_active_project({ projectId })`
5. `get_ai_context()`

If Toluva project does not exist, use `create_project` only after confirming with the user.

### 2. Create And Attach Custom Events

Read:

```text
server/services/torque-event-catalog.js
```

For each event:

1. Call `create_custom_event` with `confirmed: false`.
2. Review the response.
3. Call again with `confirmed: true`.
4. Call `attach_custom_event` for the active Toluva project.
5. Use `list_custom_events({ scope: "project" })` to confirm it is attached.

Start with `token_launch_created` first so ingestion can be tested quickly before creating all 10.

### 3. Test Real Event Ingestion

Use a temporary registry path so seed data stays clean:

```bash
cp data/launch-registry.json /private/tmp/toluva-registry-torque-test.json
TOLUVA_REGISTRY_PATH=/private/tmp/toluva-registry-torque-test.json TOLUVA_API_PORT=8792 npm run api
```

Then in another command:

```bash
curl -s -X POST http://127.0.0.1:8792/api/events \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "token_launch_created",
    "token": "TOLUVA_DEMO",
    "wallet": "11111111111111111111111111111111",
    "launchId": "demo-launch",
    "payload": {
      "source": "toluva-backend-check",
      "verified": true
    }
  }'
```

Expected success after event schema creation:

- `event.status` should become `emitted`.
- `torque.ok` should be `true`.
- Torque dashboard Event Log should show the event.

### 4. Make Events Query-Ready

Torque docs indicate custom events must be ingested at least once before query generation can use them.

After successful ingestion:

1. `list_custom_events({ scope: "project" })`
2. Confirm `token_launch_created` is query-ready.
3. Repeat at minimum for:
   - `wallet_connected_to_launch`
   - `referral_clicked`
   - `first_buy_completed`

### 5. Create First Incentive

Start with Early Buyer Leaderboard, but only after Raydium pool data is available or use a custom-event version for initial proof.

Preferred MVP proof path:

- Source: custom event
- Event: `first_buy_completed`
- Metric: `SUM(amount_usd)` or `COUNT(*)`
- Reward style: leaderboard

Use:

1. `generate_incentive_query`
2. `preview_incentive_query`
3. `create_recurring_incentive` with `confirmed: false`
4. Review budget, fee, claim window, eligibility.
5. Ask user before `confirmed: true`.

Do not create/fund real incentives without explicit user confirmation.

### 6. Raydium LaunchLab Next

Current Raydium status:

- Installed `@raydium-io/raydium-sdk-v2`.
- Installed `@solana/web3.js`.
- Installed `@solana/spl-token`.
- `GET /api/raydium/launchlab/status` reports SDK available.
- `POST /api/raydium/launches/prepare` validates launch fields.
- `POST /api/raydium/launches/transaction-plan` derives LaunchLab addresses and validates raw-unit launch inputs.
- `POST /api/raydium/launches/build-transaction` builds unsigned base64 LaunchLab transactions for client-side signing.
- `/dashboard/launches` has the injected-wallet devnet submission flow.

Not done yet:

- real devnet token launch;
- end-to-end browser test with a funded injected devnet wallet;
- deeper dashboard reads from Torque incentive state after a real incentive is created/funded;
- migration monitoring.

Next Raydium step is to run the browser flow with a funded injected devnet wallet, then inspect the resulting pool with `GET /api/raydium/launchlab/status?poolId=...`.

## Supabase Bucket List

Move file-backed registry to Supabase/Postgres later.

Reason:

- file-backed registry is fine locally;
- Render/Railway ephemeral files are risky for real users;
- Supabase gives persistence and is already available in Codex MCP config.

Do not migrate storage yet unless the user asks.

## Deployment Notes

Frontend:

- Vercel is live.
- Vite static deploy works.
- `vercel.json` handles SPA routes like `/dashboard`.
- No frontend env vars are required for static fallback mode.

Backend later:

- Deploy API to Render or Railway.
- Set backend env:
  - `TORQUE_EVENT_API_KEY`
  - `TORQUE_MCP_API_KEY` if backend needs MCP/admin operations
  - `SOLANA_CLUSTER`
  - `SOLANA_RPC_URL`
  - `RAYDIUM_*`
- Then set Vercel frontend env:
  - `VITE_TOLUVA_API_URL=https://your-backend-url`

Do not expose Torque keys in Vercel frontend env.

## Git Hygiene

Before pushing:

```bash
npm run build
git status --short
rg -n "eyJhbGci|tq_" --hidden -g '!node_modules' -g '!dist' -g '!.env' -g '!.mcp.json' .
```

Expected:

- build passes;
- `.env` and `.mcp.json` ignored;
- no real token values in public files.

## Useful Files

- `plan.md`: product plan and MVP scope.
- `README.md`: current project run/deploy notes.
- `docs/api.md`: backend API contract.
- `docs/friction-log.md`: integration friction log.
- `docs/torque-mcp-runbook.md`: Torque MCP checklist.
- `server/index.js`: local API routes.
- `server/config.js`: env/config.
- `server/load-env.js`: local `.env` loader.
- `server/torque-mcp-wrapper.js`: MCP wrapper.
- `server/services/torque-client.js`: event ingestion client.
- `server/services/torque-event-catalog.js`: custom event schema catalog.
- `server/services/raydium-launchlab.js`: Raydium LaunchLab prep/status.
- `src/lib/launchRegistry.js`: frontend registry facade with static fallback.
- `src/lib/raydiumLaunchlab.js`: browser-side LaunchLab signing/submission flow.
- `src/lib/toluvaApi.js`: frontend API helper.

## Short Prompt For New Session

Paste this into the fresh Codex session:

```text
Continue Toluva from docs/next-session-handoff.md. Torque MCP tools are available. First confirm auth/status, list projects, set Toluva active, and create/attach the token_launch_created custom event from server/services/torque-event-catalog.js. Then test POST /api/events through the backend with a temporary registry. Keep secrets out of git and do not touch UI unless necessary.
```

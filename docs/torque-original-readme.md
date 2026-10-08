# Toluva

![Toluva](public/image.png)

Incentive-native token launchpad built on Raydium LaunchLab. Every launch ships with Torque-powered growth campaigns attached from day one — early buyer leaderboards, referral raffles, and migration sprints.

## What's Built

- Token launch through Raydium LaunchLab on devnet — real bonding curve, real pool, real on-chain transaction
- Buy flow with wallet signing, devnet submission, and live pool state decoding
- 10 Torque custom events emitted across the full launch lifecycle (`token_launch_created` → `first_buy_completed` → `token_migrated` → `reward_claimed`)
- Recurring leaderboard incentive created via Torque MCP, funded on mainnet, with real recipient allocations
- Creator dashboard: bonding curve progress, buy history, early buyer leaderboard, event receipts
- Friction log documenting every Raydium and Torque integration rough edge (`docs/friction-log.md`)

## Run Locally

```bash
npm install
npm run dev
```

Starts both the API (port 8787) and frontend (port 5173) together.

```bash
npm run api      # API only
npm run dev:web  # frontend only
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```
TORQUE_EVENT_API_KEY=   # from platform.torque.so/developer
TORQUE_MCP_API_KEY=     # from platform.torque.so/connect-mcp
TORQUE_PROJECT_ID=      # your Torque project ID
SOLANA_CLUSTER=devnet
```

Without `TORQUE_EVENT_API_KEY`, events record locally as `torque_skipped` instead of reaching Torque — the dashboard still works.

## Build

```bash
npm run build
```

## Deploy

**Frontend — Vercel**

`vercel.json` handles SPA routing. Settings:
- Framework: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_TOLUVA_API_URL` to your deployed API URL

**Backend — Railway**

See deployment guide below. Set the same env vars as above plus `PORT` (Railway injects this automatically).

## Docs

- `docs/api.md` — API route reference
- `docs/friction-log.md` — Raydium and Torque integration friction log
- `docs/torque-mcp-runbook.md` — Torque MCP setup and event/incentive IDs
- `docs/devnet-proof.md` — First devnet launch proof (token TLV741, real pool and tx)

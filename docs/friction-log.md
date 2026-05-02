# Friction Log

This file tracks anything that slows down the Raydium LaunchLab or Torque integration. Keep entries concrete: what failed, where it failed, expected behavior, workaround, and whether it needs sponsor feedback.

## Open

- Raydium reference clones named in `plan.md` are not currently present in `/tmp`: `/tmp/raydium-sdk-V2-demo` and `/tmp/raydium-sdk-V2`.
- Raydium SDK dependencies are not installed yet, so LaunchLab routes currently stop at config/status/transaction-prep instead of building signed transactions.
- Claim/leaderboard data source still needs confirmation: public landing-page endpoints where possible, backend-authenticated calls where required.
- Torque recurring incentive creation flow still needs MCP/API confirmation beyond custom event ingestion.
- Current Codex session has no callable Torque MCP resources/templates even after discovery. Need `TORQUE_API_TOKEN` and MCP server configuration, or confirmation from Torque on how to expose the tools here.
- Torque ingester rejected `token_launch_created` with `Event not found for this API key`, which confirms custom event schema creation/attachment must happen before ingestion succeeds.

## Resolved

- Landing page raw HTML source is now local at `references/fintech-saas.aura.build-content.html.txt`; app import path points to the repo-local file without making Vite treat it as an HTML entry.
- Local API + file-backed registry exists, so Raydium and Torque integration can plug into backend-owned routes instead of browser-only static data.
- Torque custom event ingestion is wired behind `POST /api/events`; missing credentials degrade to local receipts instead of blocking dashboard development.
- Torque event request serializer now flattens primitive event fields directly under `data`, matching the ingestion API shape.
- Raydium LaunchLab program IDs and launch-prep parameters are backend-configurable; current docs default devnet to `DRay6fNdQ5J82H7xV6uq2aV3mNrUZ1J4PgSKsWgptcm6`.

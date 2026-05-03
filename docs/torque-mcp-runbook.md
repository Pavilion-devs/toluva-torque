# Torque MCP Runbook

This is the integration checklist for making Toluva measurable inside Torque.

## Current Local Status

- Event API key is stored in local `.env`.
- `.env.example` is sanitized and should never contain real credentials.
- `POST /api/events` reaches the Torque ingester.
- MCP token is stored in local `.env` as `TORQUE_MCP_API_KEY`.
- MCP tools work through `server/torque-mcp-wrapper.js` after calling `auth({ action: "login" })` with `TORQUE_MCP_API_KEY`.
- Toluva project ID: `cmoom7gr80030jr1inh1hm91l`.
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

## Credentials Needed

The Event API key from the Developer page only sends custom events. It is not enough for MCP project administration.

Already available locally:

- Event API key in `TORQUE_EVENT_API_KEY`.
- MCP token in `TORQUE_MCP_API_KEY`, kept separate so it does not collide with the Event API key.

Still useful from Torque:

- Toluva project ID, if available.
- Confirmation that the project in the dashboard is the intended active project.

## MCP Setup

Torque docs show this install pattern:

```bash
claude mcp add torque -e TORQUE_API_KEY=your-mcp-token -- npx @torque-labs/mcp@latest
```

For this repo, prefer the local wrapper so the token stays in `.env` and does not get copied into client config:

```bash
codex mcp add torque -- node /absolute/path/to/server/torque-mcp-wrapper.js
```

This repo also includes `.mcp.example.json` with the same wrapper shape and no secret value.

After connection:

1. `auth({ action: "status" })`
2. `list_projects()`
3. `set_active_project({ projectId })`
4. `get_ai_context()`

## Custom Event Schemas

Local API exposes the event catalog:

```text
GET /api/torque/event-schemas
```

Create each schema with `create_custom_event`, then attach it with `attach_custom_event`.

Minimum first event to unblock ingestion:

```json
{
  "eventName": "token_launch_created",
  "name": "Token Launch Created",
  "fields": [
    { "fieldName": "source", "type": "string", "label": "Source" },
    { "fieldName": "token", "type": "string", "label": "Token Symbol" },
    { "fieldName": "launch_id", "type": "string", "label": "Launch ID" },
    { "fieldName": "pool_state", "type": "string", "label": "Raydium Pool State" },
    { "fieldName": "verified", "type": "boolean", "label": "Verified" }
  ],
  "confirmed": false
}
```

Then repeat with `confirmed: true`, attach the returned event ID, and resend a Toluva event through `POST /api/events`.

Torque custom-event constraints found during integration:

- Every declared schema field is required at ingestion time.
- Custom event schemas support at most 5 string fields.
- Attach events with the returned custom event ID, not the event name.
- If SQL preview drops string quoting around an event ID, use Postgres dollar quoting, e.g. `$event$cmooypi8b0051jr1i49g8jaes$event$`.
- `/api/events` now validates local payloads against `server/services/torque-event-catalog.js` before calling Torque and returns `400` for missing required fields.

Torque docs state that custom events must be ingested at least once before they become query-ready for `generate_incentive_query`. In this project, all 10 events above have been seeded through the backend and returned `202 ACCEPTED`.

## Incentive Build Order

1. Create and attach custom events.
2. Emit at least one event for each event type.
3. Use `list_custom_events({ scope: "project" })` to confirm ingestion readiness.
4. Use `generate_incentive_query`.
5. Use `preview_incentive_query`.
6. Use `create_recurring_incentive` with `confirmed: false`.
7. Confirm budget, 5% fee, and 7-day claim window.
8. Re-run `create_recurring_incentive` with `confirmed: true`.
9. Fetch live results with `get_epoch_leaderboard`, not `preview_incentive_query`.

Current previewed proof incentive:

- Name: `Toluva Early Buyer Leaderboard Proof`
- Type: `leaderboard`
- Source event: `first_buy_completed` (`cmooypi8b0051jr1i49g8jaes`)
- Metric: `SUM(amount_usd)` via `SUM("num_val_2")`
- Emission: `SOL`
- Distribution pool: `0.1`
- Torque preview fee: `+0.01`, total pay `0.11`
- Cadence: weekly, `maxIterations: 1`
- Start: `2026-05-04T00:00:00.000Z`
- Formula: `RANK == 1 ? TOTAL_REWARD_POOL * 0.3 : RANK <= 3 ? TOTAL_REWARD_POOL * 0.15 : RANK <= 10 ? TOTAL_REWARD_POOL * 0.4 / 7 : 0`

Do not run `confirmed: true` for this incentive without explicit operator approval.

## First Three Incentives

Early Buyer Leaderboard:

- Source: `bonding_curve`
- Launchpad: `raydium_launchlab`
- Needs: Raydium `poolState`
- Measure: `volume`
- Formula example: `RANK == 1 ? 500 : RANK <= 3 ? 200 : RANK <= 10 ? 50 : 0`

Referral Raffle:

- Source: `custom_event`
- Event: `referral_clicked` or `wallet_connected_to_launch` for attribution; `first_buy_completed` intentionally keeps trade fields only because of Torque's 5-string-field limit.
- Query value: `1` for equal entries. Use `first_buy_completed` with `SUM(amount_usd)` for early-buyer volume, not referral attribution.
- Raffle weighting must be explicitly chosen: `EQUAL_CHANCES` or `WEIGHTED_BY_METRIC`.

Migration Sprint:

- Source: `bonding_curve`
- Launchpad: `raydium_launchlab`
- Needs: Raydium `poolState`
- Measure: `volume` or `count`
- Use a leaderboard or raffle depending on reward design.

## Questions For Sheldon

- Can the event API key create or attach custom event schemas, or is MCP auth mandatory?
- Are custom event schemas project-independent globally, and are event names globally unique per user or per workspace?
- Does the ingester reject extra fields not present in the schema, or can schemas evolve after ingestion?
- Is there a REST endpoint for `list_recurring_incentives`, `get_epoch_leaderboard`, and claim status, or should all admin/result fetching go through MCP?
- For Raydium LaunchLab incentives, does `bonding_curve` source require only `poolState`, or also token mint/platform fields in edge cases?

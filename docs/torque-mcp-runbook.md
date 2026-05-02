# Torque MCP Runbook

This is the integration checklist for making Toluva measurable inside Torque.

## Current Local Status

- Event API key is stored in local `.env`.
- `.env.example` is sanitized and should never contain real credentials.
- `POST /api/events` reaches the Torque ingester.
- Current blocker: Torque returns `Event not found for this API key` until custom event schemas are created and attached to the Toluva project.
- MCP token is stored in local `.env` as `TORQUE_MCP_API_KEY`.
- MCP tools are not available in this Codex session yet: local MCP resource/template discovery returns empty lists. The client likely needs to be restarted with the Torque MCP config.

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

Torque docs state that custom events must be ingested at least once before they become query-ready for `generate_incentive_query`.

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

## First Three Incentives

Early Buyer Leaderboard:

- Source: `bonding_curve`
- Launchpad: `raydium_launchlab`
- Needs: Raydium `poolState`
- Measure: `volume`
- Formula example: `RANK == 1 ? 500 : RANK <= 3 ? 200 : RANK <= 10 ? 50 : 0`

Referral Raffle:

- Source: `custom_event`
- Event: `first_buy_completed`
- Query value: `1` for equal entries, or `SUM(amount_usd)` for volume-weighted entries.
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

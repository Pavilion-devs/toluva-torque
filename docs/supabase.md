# Supabase Setup

Toluva uses Supabase as its persistent registry store. The file-backed registry (`data/local-launch-registry.json`) is only used as a fallback when Supabase is not configured.

## Setup Steps

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New project.

### 2. Run the schema

In the Supabase SQL editor (`your-project.supabase.co/project/_/sql`), paste and run the contents of `scripts/supabase-schema.sql`.

This creates four tables: `launches`, `campaigns`, `event_receipts`, `campaign_results`.

### 3. Get your credentials

From the Supabase dashboard → Project Settings → API:

- **Project URL** → `SUPABASE_URL`
- **service_role key** (not the anon key) → `SUPABASE_SERVICE_ROLE_KEY`

Add both to your local `.env` and to Railway environment variables.

### 4. Install the client

```bash
npm install @supabase/supabase-js
```

## Tables

| Table | Purpose |
|---|---|
| `launches` | One row per token launch. Keyed by `sym`. |
| `campaigns` | Torque campaigns attached to launches. |
| `event_receipts` | Torque events, verified DBC swaps, and immutable Conviction balance observations. The latter two use deterministic IDs and can be written only by server verification code. |
| `campaign_results` | Leaderboard and claim status per campaign. |

## Fallback Behaviour

Without `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the environment, the server falls back to the file-backed registry at `data/local-launch-registry.json`. This means the app still works locally without a Supabase project configured.

## Notes

- Use the `service_role` key on the backend only — never expose it in the frontend.
- `event_receipts` grows unbounded in production; add a retention policy or archival job if needed beyond the hackathon.
- The `launches.raydium` and `launches.torque` columns are `jsonb` — they store the full Raydium pool state and Torque campaign metadata without needing schema changes.

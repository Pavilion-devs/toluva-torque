-- Toluva Supabase Schema
-- Run this in the Supabase SQL editor: your-project.supabase.co/project/_/sql

-- ─── Launches ────────────────────────────────────────────────────────────────

create table if not exists launches (
  sym             text primary key,
  name            text not null,
  description     text not null default '',
  image           text,
  status          text not null default 'draft',
  bonded          float not null default 0,
  campaign        text,
  buyers          int not null default 0,
  pool            text,
  age             text not null default 'Draft',
  migration_time  text not null default 'Draft',
  migration_state text not null default 'draft',
  raydium         jsonb,
  torque          jsonb,
  creator         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Campaigns ───────────────────────────────────────────────────────────────

create table if not exists campaigns (
  id          serial primary key,
  type        text not null,
  launch      text not null,
  status      text not null default 'scheduled',
  pool        text not null default '0.0',
  paid        text not null default '0.0',
  progress    float not null default 0,
  info        text not null default 'Pending Torque setup',
  state       text not null default 'Scheduled',
  accent      text not null default 'pink',
  torque      jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Event Receipts ──────────────────────────────────────────────────────────

create table if not exists event_receipts (
  id              text primary key,
  type            text not null,
  token           text,
  wallet          text,
  payload         jsonb not null default '{}',
  torque_request  jsonb,
  torque_receipt  jsonb,
  torque_error    jsonb,
  status          text not null default 'recorded',
  created_at      timestamptz not null default now()
);

-- ─── Campaign Results ────────────────────────────────────────────────────────

create table if not exists campaign_results (
  campaign_id   int primary key,
  leaderboard   jsonb not null default '[]',
  claim_status  text not null default 'pending_torque_integration',
  updated_at    timestamptz not null default now()
);

-- ─── Helper function: increment buyers count ────────────────────────────────

create or replace function increment_buyers(p_sym text)
returns void language sql as $$
  update launches set buyers = buyers + 1, updated_at = now() where sym = p_sym;
$$;

-- ─── Indexes ─────────────────────────────────────────────────────────────────

create index if not exists event_receipts_type_idx    on event_receipts (type);
create index if not exists event_receipts_token_idx   on event_receipts (token);
create index if not exists event_receipts_wallet_idx  on event_receipts (wallet);
create index if not exists event_receipts_created_idx on event_receipts (created_at desc);
create index if not exists launches_status_idx        on launches (status);
create index if not exists campaigns_launch_idx       on campaigns (launch);

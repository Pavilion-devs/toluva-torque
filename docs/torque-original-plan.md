# Incentive-Native LaunchLab Platform Plan

## Working Name

Toluva

## Product Thesis

Most token launchpads help creators launch a token, then leave growth as a separate problem.

Toluva is a Raydium LaunchLab-powered token launchpad where every launch ships with Torque-powered incentives from day one: early buyer rewards, referral raffles, migration campaigns, holder leaderboards, and claim pages.

The wedge is not "another pump.fun clone." The wedge is:

> Launch tokens with growth campaigns already attached.

## Track Fit

### Torque MCP Track

Torque is looking for builders who dig into the MCP package, use the tools seriously, find rough edges, communicate feedback, and build useful integrations.

This project should exercise the Torque surface area deeply:

- project setup;
- custom event data sources;
- query generation and preview;
- recurring incentive creation;
- leaderboard/result fetching;
- claim/landing-page flows;
- friction log and feedback for Torque.

The product produces measurable Torque activity:

- launch created;
- referral clicked;
- buyer joined;
- first buy completed;
- migration threshold approached;
- token migrated;
- reward claimed.

### 100xDevs Frontier Track

100xDevs rewards real, technically strong Solana products with good execution, UX, completeness, and real-world usefulness.

This product is a real Solana app:

- wallet UX;
- token launch flow;
- Raydium LaunchLab SDK integration;
- metadata creation;
- bonding curve progress;
- migration monitoring;
- backend event ingestion;
- Torque-powered incentives;
- token launch page with public rewards and claims.

## Core User Flows

### Creator Flow

1. Connect wallet.
2. Create launchpad token:
   - token name;
   - symbol;
   - description;
   - image;
   - social links;
   - launch parameters;
   - reward budget;
   - campaign type.
3. Launch token through Raydium LaunchLab.
4. Attach a Torque incentive campaign.
5. Share public launch page.
6. Track migration and incentive progress.

### Trader / Community Flow

1. Open token launch page.
2. Connect wallet.
3. Buy token through LaunchLab flow.
4. See referral/incentive status.
5. Climb leaderboard or qualify for raffle.
6. Claim rewards when eligible.

### Admin / Builder Flow

1. Monitor created launches.
2. Inspect emitted events.
3. Create or repair Torque incentives.
4. View friction log.
5. Export submission evidence.

## MVP Scope

### Must Have

- Raydium LaunchLab token launch on devnet.
- Public launch page per token.
- Bonding curve and migration status display.
- Torque custom events emitted from the app/backend.
- At least one Torque recurring incentive attached to a launch.
- Leaderboard display or claim-status display from Torque landing-page/API flow.
- Friction log documenting what broke, what was confusing, and what we reported to Torque.
- Clean README and demo script.

### Should Have

- Referral links per token.
- Multiple incentive templates:
  - early buyer leaderboard;
  - referral raffle;
  - migration sprint.
- Creator dashboard.
- Token metadata upload helper.

### Not MVP

- Mainnet launch automation.
- Full permissionless production launchpad.
- Advanced anti-sybil system.
- Complex tokenomics designer.
- Own bonding curve program.

## Technical Architecture

### Frontend

Likely stack:

- Next.js or Vite React;
- Solana wallet adapter;
- Raydium SDK calls for LaunchLab interactions;
- creator flow;
- token launch pages;
- leaderboard and claim widgets.

### Backend

Likely stack:

- Node/TypeScript API routes or server;
- event ingestion layer;
- Torque API/MCP bridge;
- environment-protected secrets;
- launch registry database.

Backend responsibilities:

- store launches and campaign metadata;
- emit Torque custom events;
- protect Torque credentials;
- call authenticated Torque endpoints where required;
- optionally normalize Raydium pool state for frontend.

### Storage

For MVP:

- Postgres/Supabase, SQLite, or simple file-backed DB depending on setup speed;
- store launch records, referral codes, emitted event receipts, and friction log entries.

### Solana / Raydium

Use Raydium LaunchLab instead of writing a launch program.

Relevant Raydium pieces:

- create platform config / Platform PDA;
- create launchpad token;
- pool state;
- buy/sell transactions;
- migration status.

## Torque Integration Plan

### Events

Initial custom events:

- `token_launch_created`
- `launch_page_shared`
- `referral_clicked`
- `wallet_connected_to_launch`
- `first_buy_completed`
- `buy_completed`
- `migration_threshold_hit`
- `token_migrated`
- `reward_claim_started`
- `reward_claimed`

### Incentive Templates

1. Early Buyer Leaderboard
   - Metric: qualifying buy volume or first-buy participation.
   - Reward: top N wallets.

2. Referral Raffle
   - Metric: referred wallets that complete qualifying action.
   - Reward: raffle among valid referrers.

3. Migration Sprint
   - Metric: activity contributing to migration before deadline.
   - Reward: leaderboard or raffle around migration milestone.

### Landing Page Data

Use Torque public landing-page endpoints where possible for:

- latest evaluation results;
- leaderboard;
- offer details;
- claim trigger/status.

Use backend-only authenticated calls for:

- recurring incentive details;
- recipient/payout data;
- raw query exports.

## Raydium SDK / Demo Code Strategy

We should not fork Raydium SDK or demo code at the start.

Recommended approach:

1. Create our own app/repo.
2. Install `@raydium-io/raydium-sdk-v2` as a dependency.
3. Use Raydium docs and demo code as implementation references.
4. Clone Raydium demo/source only as read-only reference material if needed.
5. Do not vendor or copy large SDK/demo chunks into our codebase unless a small pattern is necessary and clearly attributed.

Where to clone references:

- Short-lived research: `/tmp/raydium-sdk-V2-demo` and `/tmp/raydium-sdk-V2`.
- If we need persistent reference while building: `references/raydium/`, added to `.gitignore` unless we intentionally want notes/examples.

Forking is only useful if:

- we discover a Raydium SDK bug and want to submit a PR;
- we need to patch SDK behavior temporarily;
- we want to pin and modify demo code for our own template.

For now, no fork is needed. We should build against the published SDK and keep links to exact docs/source.

## Implementation Phases

### Phase 0: Research Lock

- Confirm LaunchLab devnet program IDs and SDK examples.
- Confirm Platform PDA creation requirements.
- Confirm Torque custom event ingestion path.
- Confirm minimum viable incentive creation flow through MCP/API.
- Create a shared friction log from day one.

### Phase 1: Project Scaffold

- Initialize app.
- Add wallet adapter.
- Add env handling.
- Add basic launch registry.
- Add Raydium SDK dependency.
- Add Torque integration wrapper.

### Phase 2: Raydium LaunchLab Devnet Flow

- Create or configure Platform PDA.
- Build token creation form.
- Upload/attach metadata.
- Call LaunchLab create flow.
- Persist token/pool details.
- Render launch status page.

### Phase 3: Torque Event Layer

- Add event emitter abstraction.
- Emit events for launch creation and page activity.
- Add referral tracking.
- Add event debug panel for development.
- Verify events reach Torque.

### Phase 4: Incentive Creation

- Create first incentive template.
- Generate/preview query.
- Create recurring incentive.
- Link incentive to launch page.
- Display leaderboard/results.

### Phase 5: Claims and Demo Polish

- Add claim status UI.
- Add creator dashboard.
- Add friction log UI/page.
- Seed demo launch with test activity.
- Record demo path.

### Phase 6: Submission

- Public GitHub repo.
- README with setup and architecture.
- Deployed demo.
- X demo video tagging `@torqueprotocol`.
- Colosseum submission.
- Superteam submissions for Torque and 100xDevs.

## Open Questions

- What exact Torque API endpoint should we use for custom events if MCP alone is not enough?
- Can Torque incentives use Raydium LaunchLab onchain actions directly, or should we rely on custom events first?
- What is the simplest valid LaunchLab devnet token launch configuration?
- Do we need a persistent Platform PDA for the demo, or can launch tokens use a generic config first?
- What reward asset should we use on devnet for Torque incentive demos?
- Can the claim flow be fully demonstrated on devnet without mainnet funds?

## Risk Register

### Risk: Building just a launchpad is not differentiated.

Mitigation: make incentive creation the core flow, not an optional tab.

### Risk: Raydium SDK integration takes longer than expected.

Mitigation: start with Raydium demo code and devnet only. Avoid custom onchain programs.

### Risk: Torque MCP does not expose every needed action.

Mitigation: use MCP where possible, API where necessary, and document the friction clearly.

### Risk: 100xDevs judges see it as a memecoin tool.

Mitigation: frame it as incentive infrastructure for token communities and migration readiness, with polished UX and real technical depth.

### Risk: No live activity.

Mitigation: create multiple demo launches, invite test wallets, and seed real devnet activity before submission.

## Communication Plan With Torque

Since Torque explicitly values engaged builders:

- Keep a daily friction log.
- Share blockers with Matt/Torque early.
- Report unclear docs or MCP tool gaps.
- Ask for confirmation when choosing event schemas.
- Ask for feedback on the incentive templates before final demo.

## Success Criteria

By submission, we should be able to demo:

1. Create a token launch from our platform.
2. Show Raydium LaunchLab pool/progress.
3. Trigger user activity from at least two wallets.
4. Emit activity into Torque.
5. Create or display a Torque-powered incentive.
6. Show leaderboard or claim state.
7. Explain exactly what worked, what broke, and what Torque should improve.

## Key Sources

- Raydium LaunchLab overview: https://docs.raydium.io/raydium/launchlab/launchlab
- Raydium LaunchLab platforms: https://docs.raydium.io/raydium/launchlab/launchlab/platforms
- Raydium SDK LaunchLab docs: https://docs.raydium.io/raydium/build/ts-sdk-demo/launchlab
- Raydium create platform docs: https://docs.raydium.io/raydium/build/ts-sdk-demo/launchlab/creating-a-platform
- Raydium launch token docs: https://docs.raydium.io/raydium/build/ts-sdk-demo/launchlab/launching-a-token
- Raydium SDK launchpad source: https://github.com/raydium-io/raydium-sdk-V2/tree/master/src/raydium/launchpad
- Raydium SDK LaunchLab demo: https://github.com/raydium-io/raydium-sdk-V2-demo/tree/master/src/launchpad
- Torque MCP track: https://superteam.fun/earn/listing/build-with-torque-mcp-1
- 100xDevs track: https://superteam.fun/earn/listing/100xdevs-frontier-hackathon-track
- Torque MCP quickstart: https://platform.torque.so/docs/mcp/quickstart
- Torque MCP data sources: https://platform.torque.so/docs/mcp/tools/data-sources
- Torque MCP incentives: https://platform.torque.so/docs/mcp/tools/incentives
- Torque landing pages: https://platform.torque.so/docs/mcp/guides/building-landing-pages

# Toluva × Meteora — product and build plan

**Status:** M0 recipe defined; first creator-signed M1 launch and DBC-to-DAMM v2 M2 lifecycle verified on devnet. M1/M2 exit still needs independent creator reproduction and a wallet-signed sell on an active curve.
**Working name:** Toluva Conviction
**Base:** `Pavilion-devs/toluva-torque`, cloned from `main` at `2141540` onto local branch `meteora-plan`.
**Prior plan:** [docs/torque-original-plan.md](docs/torque-original-plan.md). Keep the original project history visible and disclose reused code in any hackathon submission.

Colosseum permits pre-existing code when disclosed and judges work completed during its competition period. The submission must make Toluva's earlier work and the new Meteora work easy to distinguish.

## 1. The bet

Toluva already combines a token launch with a growth campaign. For Meteora, we will make the **launch economics and the campaign one coherent product**. Creators will choose a launch objective, see the resulting DBC curve and liquidity commitments, launch a token, and run campaigns based on independently verified behavior through graduation and beyond.

The first product wedge is **conviction launches for emerging on-chain projects and communities**. A launch should reward useful participation: reaching graduation with a broad set of real buyers, remaining engaged after graduation, or contributing durable liquidity. A launch is measured by participation and liquidity quality, not merely token count or raw trading volume.

This is a working wedge, not a claim of validated demand. The product must let an unaffiliated creator complete the same launch flow that we use in testing. We can use a clearly labelled Toluva-owned test launch and seek independent testers and prospective issuers for demand evidence; neither path gets special application behavior.

**Product rule:** adapt the existing Toluva UI components and design system. Build general launch, campaign and analytics flows around stored config/pool/campaign IDs. Never hardcode a token, wallet, campaign, result, or privileged path merely to make a presentation work.

### One-sentence pitch

> Toluva lets projects design a Meteora DBC launch and attach verifiable campaigns that carry their community from price discovery into lasting DAMM v2 liquidity.

### Who uses it

| User | Job to do | First version of the solution |
| --- | --- | --- |
| Creator or project | Launch a token with understandable economics and a credible liquidity plan | Guided DBC configuration, preview, wallet-signed launch, public terms |
| Buyer or community member | Understand price, fees, graduation, and campaign eligibility | Public launch page, live quotes, risk/fee display, wallet-signed trades, transparent progress |
| Creator after graduation | Keep an active market and reward lasting participation | DAMM v2 position/lock view, verified campaign results, claims where actually supported |
| Builder or integrator | Reuse proven launch configurations and track outcomes | Documented config recipes and public launch data; an API may follow after the core flow works |

### What this entry must demonstrate

1. Meteora DBC is the actual token launch and price-discovery engine, not a badge in the UI.
2. The chosen curve, quote token, fee schedule, migration threshold, and liquidity split all have an explicit product rationale.
3. A working lifecycle: config → pool → DBC buy/sell → curve progress → DAMM v2 migration → post-migration pool/position view.
4. Campaign eligibility comes from confirmed on-chain facts. Any reward or claim shown as live must be real.
5. A public, reproducible proof trail: code, transaction signatures, on-chain addresses, limitations, and a concise demo.

## 2. Why this fits the Meteora track

The [listing](https://superteam.fun/earn/listing/meteora-dbc) values depth of Meteora integration, technical execution, originality, impact, and real usage. Our interpretation:

| Judging criterion | Evidence we will produce |
| --- | --- |
| Depth of integration | DBC config creation and trading; DAMM v2 migration, position ownership and locks; DLMM only if a real post-graduation use case is built |
| Technical execution | Official SDK use, transaction simulation, state-machine handling, verified event ingestion, idempotency, tests for financial calculations and lifecycle transitions |
| Originality and taste | A launch objective determines curve and campaign behavior; public launch terms and post-graduation retention are core to the UX |
| Impact potential | Repeatable launch recipes for communities and projects, with transparent evidence of what launch design produces |
| Traction | A real pilot, independently operated tester wallets, and honest on-chain metrics; no self-generated volume presented as organic traction |

An ordinary launch form is insufficient: Meteora already publishes a [Fun Launch scaffold](https://docs.meteora.ag/invent/scaffold/fun-launch), and public entries already offer curve designers and simulations. Our difference must be the **joined-up launch and post-launch participation system**.

## 3. Product shape and boundaries

### Creator flow

1. Connect wallet and choose a launch objective. First recipe: **Conviction**, optimized for broad initial participation and durable post-graduation liquidity. A creator can use a published reusable config. Custom config creation is also a self-service path once its validation is ready.
2. Enter token identity and upload real metadata. Show the exact mint authority, update authority, supply model, and metadata URI before signing.
3. Choose a quote asset. Start with a supported, liquid quote asset for the proof launch. Add custom SPL quote pairs only after quote-mint support and migration operations are tested.
4. Review a DBC config: starting price, one or more curve segments, fee schedule, migration quote threshold, creator/partner fee split, DAMM v2 fee choice, and liquidity lock/vesting distribution.
5. Preview outcomes for several buy/sell paths using official SDK math where available. Label estimates clearly and test them against devnet quotes; the preview must never imply guaranteed returns.
6. Sign pool creation with the creator wallet and a browser-generated base-mint signer against the selected config. For a custom config, the creator wallet pays and signs config creation with a browser-generated config signer; the UI discloses the fee claimer and leftover receiver. Store only public addresses and transaction evidence on the server.
7. Publish a launch page and attach a campaign with explicit qualification rules and funding state.

### Participant flow

1. Read public launch terms, curve, fees, quote asset, contract addresses, reward rules, and risk/limitations.
2. Connect wallet; get a current quote and minimum received before a DBC buy or sell.
3. Sign the trade; see confirmation, position, and on-chain graduation progress.
4. See campaign progress computed from verified chain activity. After graduation, see the DAMM v2 pool and liquidity commitments.
5. Claim a reward only when the backing campaign/distributor actually exists and the wallet is eligible. Otherwise show a clearly labelled proof score or pending state.

### First campaign: Graduation Conviction

Qualifying actions are verified DBC participation **and** continued token holding across a disclosed post-graduation observation window. The first implementation can publish a deterministic leaderboard or eligibility proof without paying tokens. A funded payout is a later gate, after the event pipeline and Torque (or another distributor) are verified end to end.

The exact formula, observation window, minimum trade, eligible token accounts, and disqualification rules will be fixed and published before any funded campaign opens. We will not reward raw clicks, unverified client events, or circular volume. No scoring formula can completely solve Sybil behavior; the rules and limits must be explicit.

### Product boundaries

- **Required:** DBC and DAMM v2 lifecycle, one truthful campaign, production-grade public launch page, and a reproducible proof run through the normal user flow.
- **Conditional:** Torque payout/claim integration, once we verify it can consume our trusted events and support the chosen network/reward asset.
- **Expansion:** DLMM liquidity strategies, custom quote pairs, multiple campaign recipes, config marketplace, Alpha Vault, Token 2022/stock-pair flows, and developer APIs. Each needs a concrete user reason and its own acceptance proof.
- **Excluded from the first release:** a new bonding-curve smart contract, implied stock ownership/RWA claims, unsupported automatic migration promises, fake activity, and token economics that depend on an untested external operator.

## 4. Repository audit and reuse map

The current repo is a genuine Raydium LaunchLab + Torque project. Its README documents a devnet launch and its [devnet proof](docs/devnet-proof.md) records addresses and a Torque receipt. It is a strong base, while the Meteora protocol path is new work.

| Existing component | Decision | Work required |
| --- | --- | --- |
| `src/components/dashboard/**`, `src/App.jsx`, design system | Reuse and refocus | Rename Raydium-specific labels; make launch economics, lifecycle, campaign truth, and proof visible |
| `src/lib/walletAdapter.js`, wallet-signed transaction pattern in `src/lib/raydiumLaunchlab.js` | Reuse pattern | Adapt signing/simulation for Meteora transactions and supported wallets |
| `server/index.js`, API envelope, registry/store and Supabase support | Reuse structure | Split routes into DBC, migration, verified events, and campaign services; add validation and access controls |
| `server/services/raydium-launchlab.js`, Raydium package/config | Replace protocol dependency | Build a Meteora DBC adapter using the official SDK; remove Raydium from the Meteora product path |
| Torque event catalog, client, leaderboard and claim UI | Reuse selectively | Define Meteora lifecycle events; connect real campaign creation/results and only show funded claims when verified |
| `TokenDetailPage.jsx` campaign templates | Rebuild behavior | Current attach flow records a campaign with `recurringOfferId: null`; it does not provision a new incentive |
| `LaunchesPage.jsx`, `IncentivesPage.jsx`, `TokenDetailPage.jsx` seeded values | Replace with real product state | Remove placeholder metadata URI, prior-project proof links, fallback reward pool and fixed campaign amounts. Keep amount presets only as editable input conveniences, never as launch or reward facts |
| `POST /api/events` and `POST /api/launches/:sym/buy-events` | Redesign before payouts | Current API accepts caller-supplied event facts/signatures. Verify transactions, account owners, amounts, pool, and finality server-side; deduplicate by signature and instruction/event index |
| `data/launch-registry.json` and deployed dashboard | Reuse schema idea | Separate local test fixtures, devnet and mainnet; make the deployed API/persistence observable and avoid silent local fallback in production |

The original Torque plan is archived intact. We will preserve the existing winning product's history in Git and clearly identify reused work in the new README and submission.

## 5. Technical architecture

```text
Creator / participant browser
  ├─ Toluva React UI and Solana wallet
  ├─ Meteora DBC SDK: transaction builders and quotes
  └─ wallet signs and submits transactions

Config authoring
  ├─ published reusable configs, created and reviewed by Toluva
  └─ self-service custom configs, paid/signed by the creator wallet

Toluva API
  ├─ launch registry and immutable config snapshot
  ├─ DBC / DAMM v2 state reads and lifecycle tracker
  ├─ transaction/event verifier and idempotent event store
  ├─ deterministic campaign scoring
  └─ Torque adapter for eligible campaigns and claims

Solana / Meteora
  ├─ DBC config + virtual pool + swaps
  ├─ migration keeper or explicit migration transaction
  └─ DAMM v2 pool + position NFTs + locks/vesting
```

### Meteora integration

- Use the official [`@meteora-ag/dynamic-bonding-curve-sdk`](https://docs.meteora.ag/developer-guides/dbc/typescript-sdk/getting-started) for config builders, pool creation, quotes, swaps, migration and state reads. Pin a tested version when implementation begins.
- Keep config creation and pool creation distinct. DBC configs are reusable templates: any payer can create one, the config account and payer sign its creation, and a token creator later signs a pool launch from that existing config. Toluva may publish presets; custom configs must be creatable with the user's wallet without an operator queue. The config fixes its fee claimer and leftover receiver, so display and validate those addresses before signing.
- Use the official [DAMM v2 SDK](https://docs.meteora.ag/developer-guides/damm-v2) or Data API for the migrated pool, positions, locks, fees and post-migration analytics.
- Treat DBC and DAMM v2 as separate lifecycle states. New DBC configs use DAMM v2 migration. A DLMM pool is an additional post-graduation integration, **not** DBC's migration destination.
- Start with one documented curve recipe. DBC can have up to 16 segments; we will add complexity only when it supports a user-facing objective and its math passes devnet checks.
- Expose every economic setting that affects buyers: quote mint, price path, trading fees, migration threshold, protocol/creator/partner economics, supply authorities, and liquidity locks.
- Account for migration keeper thresholds and supported quote mints. On devnet, use the documented manual migration path or SDK transactions; on mainnet, never promise keeper-driven graduation for an ineligible quote/threshold.

### Storage and service boundaries

- Keep Vite/React and the current Node service initially. Avoid a framework rewrite during protocol integration.
- Prefer Supabase/Postgres for the public deployment; file-backed storage remains a local development fallback. Production must surface API failure rather than render an apparently live empty dashboard.
- Store network, config address, pool address, mint, creator wallet, config snapshot/hash, transaction signatures, campaign policy version, reward funding state, and migrated DAMM v2 addresses.
- Scope every launch, campaign, event and analytics query by its stored network and on-chain identifiers. Product pages must render arbitrary valid launches from the database; no build-time token addresses, fabricated metrics or demo-only branches.
- Define a protocol adapter boundary (`MeteoraDbcAdapter`, `DammV2Reader`) so UI code does not decode accounts or construct economic parameters ad hoc.
- Add request validation and role/ownership checks for creator actions. No private keys, API tokens, or signing authority in browser-visible environment variables or committed files.

### Trustworthy event and reward pipeline

1. Browser or chain indexer supplies a transaction signature as a *hint*.
2. Server fetches the transaction and relevant Meteora accounts from the intended cluster.
3. Server confirms success/finality, program ID, pool and mint, signer, token balance deltas, and decoded instruction/event semantics.
4. Server records a unique event key (`cluster + signature + instruction/event index`) and updates launch state idempotently.
5. Campaign scorer derives eligibility from this trusted store plus explicit token-balance and/or LP-position snapshots.
6. Torque receives only server-derived events. A successful Torque ingestion receipt is not proof the underlying trade was genuine.
7. UI distinguishes `observed`, `verified`, `eligible`, `funded`, and `claimed` states.

Before funded rewards, test replay, forged signatures, mismatched wallets, wrong pools, failed transactions, double-counting, reorg/finality handling, and snapshot timing. Publishing an honest, unfunded score is preferable to an unreliable payout.

## 6. Milestones and exit gates

These are ordered by dependency, not by a deadline. Do not expand scope until the current gate has evidence.

### M0 — Baseline and product lock

- Preserve the prior plan and document which code predates this entry.
- Run the existing build and record current deployed API behavior.
- Review the official DBC/DAMM v2 SDK examples and freeze tested versions.
- Choose the first quote asset, creator/partner authority model, supply model, curve recipe, fee schedule, migration threshold, DAMM v2 fee mode, and liquidity lock split.
- Write a one-page economic explanation and a public campaign policy. Keep a list of unresolved decisions in this plan.

**Exit:** config spreadsheet/spec with exact units, addresses and expected lifecycle; no hidden economic defaults.

**Baseline recorded 2026-10-08:** the cloned app installs and its Vite production build passes with Node 24.19.0. The host's default Node 18 emits engine warnings for some dependencies; use a supported Node version for development and deployment. The original dependency audit reported 39 advisories. The deployed prior-project API could not be relied on; the local Meteora API and explicit production API setting now drive the new launch screens. The prior UI's seeded metadata, proof links and reward amounts were removed from public Meteora flows. The existing Raydium/Torque code remains archived or gated in source.

**Implementation progress:** the first devnet economic recipe is specified in [docs/conviction-v1.md](docs/conviction-v1.md), with the official DBC SDK pinned at `1.5.13`. Config construction passes SDK validation at 1, 5 and 100 SOL targets. The normal creator UI produced a signed config and token pool; two signed buys filled the 1 SOL curve; a signed migration created the expected DAMM v2 pool. The public page reads live DBC progress, on-chain config terms, graduated pool state, creator position NFT, liquidity lock and fees. Every completed step has addresses and signatures in [docs/meteora-proof.md](docs/meteora-proof.md). The [read-only devnet validation record](docs/meteora-readonly-validation.md) also shows independent status, quote/build and historical-pool checks. A wallet-approved, content-addressed [metadata hosting path](docs/metadata-hosting.md) is implemented and tested against isolated storage; a durable public backend and real launch through it remain to be proven. A signed sell, unaffiliated creator reproduction and campaign verification remain open, so the full M1/M2 exit gates are not yet met.

**Dependency triage:** after adding the DBC SDK, `npm audit --omit=dev` reports 17 production advisories (7 moderate, 10 high, 0 critical). The SDK's high classification is inherited from Anchor and Solana dependencies and has no automatic fix in the current package graph. Review affected code paths and upstream releases before mainnet or a public wallet-facing deployment; do not apply breaking dependency downgrades blindly.

### M1 — DBC config and launch

- Build validation and preview for reusable config selection. Create and publish the first config through a documented Toluva wallet flow.
- Build the self-service custom-config flow with user-signed creation and transparent fee recipients.
- Upload metadata and let an unaffiliated creator wallet launch a token/virtual pool from either supported config path on devnet.
- Persist and reread all addresses from chain; handle rejected signatures and retries.
- Show public launch terms and explorer links.

**Exit:** another person can reproduce a devnet launch from the README; signatures and account data match the UI.

### M2 — Trading and lifecycle

- Implement accurate DBC quotes and wallet-signed buy/sell with slippage and fee disclosure.
- Read curve progress from pool state, not local counters.
- Detect `PreBondingCurve`, completion, migration steps, and `CreatedPool`; support recovery from interrupted migrations.
- Read migrated DAMM v2 pool, positions, ownership, locks/vesting, and fees.

**Exit:** a recorded end-to-end devnet lifecycle, including post-migration state; UI never labels a completed curve as an already migrated pool.

### M3 — Conviction campaign proof

- Replace unverified client event ingestion for reward-bearing facts.
- Publish a fixed eligibility policy and deterministic scorer.
- Show a public leaderboard/eligibility proof backed by on-chain evidence.
- Add tests for forged/replayed events and two-wallet activity.

**Exit:** independent wallets can participate and an auditor can trace every qualifying event to a Meteora transaction and policy version.

### M4 — Reward distribution, if supported

- Verify Torque's current data-source, network, incentive creation, funding, and claim capabilities against official docs and a small test.
- Provision one actual campaign and persist its remote ID; show funding status and claim receipts.
- If Torque cannot support the chosen lifecycle safely, keep the on-chain verified campaign proof and use a separate, explicitly designed distribution mechanism only after review.

**Exit:** an eligible independent wallet can claim a funded reward and verify the payout transaction. If this gate is not met, the product and demo label rewards as unfunded proof.

### M5 — Public product trial and evidence

- Deploy a stable API and database; configure network-specific RPC and monitoring.
- Use the ordinary self-service flow for a clearly labelled Toluva-owned trial launch. Recruit independent testers openly; record usability feedback and real activity without wash trading.
- Show metrics: unique verified participants, retention across graduation, post-migration liquidity depth/lock, campaign completion, and failures. Avoid vanity launch counts.
- Prepare a short pitch, live demo, architecture diagram, reproducible README, test results, and pre-existing-code disclosure.

**Exit:** an unaffiliated creator can launch and operate a campaign, participants can use the public page, and anyone can verify the core claims from public links without private access.

## 7. Product acceptance walkthrough and proof package

The acceptance walkthrough exercises the same journey available to every creator and participant:

1. Creator picks Conviction and sees why Toluva chose the curve, quote asset, fee schedule and liquidity commitment.
2. Creator launches a token on DBC; UI opens the real config, pool and mint accounts.
3. Two independent wallets get quotes and trade on the curve.
4. The verified campaign shows each wallet's qualification status and supporting transactions.
5. The curve completes; the UI shows migration as a separate step.
6. The DAMM v2 pool appears with its real position ownership and lock/vesting terms.
7. A participant qualifies after the observation window; if M4 is complete, show an actual claim and payout. Otherwise show a transparent proof score.

Keep a public evidence page or `docs/meteora-proof.md` with network, config/pool/mint addresses, signatures, a reproducible command or UI path, screenshots/video, and exactly what remains unverified. Its addresses are records from an actual launch, never constants that drive the application. Do not copy the previous Raydium proof as Meteora proof.

## 8. Risk register and decisions

| Risk | Response |
| --- | --- |
| A Raydium SDK swap looks like a superficial port | Make DBC configuration and DAMM v2 lifecycle central to creator and participant flows; show economic rationale |
| No external issuer at the start | Use a self-owned pilot for mechanics; recruit independent testers and conduct issuer interviews for demand evidence |
| Referral/early-buy campaigns invite farming | First campaign uses verified chain facts and sustained behavior; cap concentration, publish rules and report limitations |
| Existing event API can be spoofed | Close reward-bearing paths until server-side verification and idempotency are complete |
| Config preview diverges from on-chain behavior | Use official quote helpers, simulate transactions, compare with devnet outcomes, and label estimates |
| Custom quote asset cannot be migrated by Meteora keepers | Start with a documented supported quote/threshold; implement and test explicit migration for other pairs |
| DAMM v2 migration has multiple states and position owners | Model states explicitly and verify locks, ownership, fee settings and pool address from chain |
| Torque campaign setup or payout fails | Make claims a separate gate; show real remote IDs and funding state; retain an honest verified-score demo |
| Deployed backend is unavailable | Add health checks, monitoring and error states; avoid silent static fallback in production |
| Reward economics require capital | Budget gas, metadata hosting, quote liquidity, protocol fees and funded rewards before mainnet activity; never imply a free graduation |
| Prior code eligibility/disclosure | Keep history, record new work separately, and disclose the reused Toluva code in submissions |

### Defaults to proceed with, subject to M0 validation

- Brand: Toluva, with “Conviction” as the first launch recipe rather than a permanent rebrand.
- Network sequence: devnet proof, then a separately reviewed mainnet pilot.
- Quote asset: SOL for Conviction v1 on devnet, as specified in [docs/conviction-v1.md](docs/conviction-v1.md). Mainnet keeper eligibility and quote support need a separate review before launch.
- Campaign: one verifiable graduation/retention policy before referral raffle or migration sprint.
- Existing stack: keep the React/Vite UI, Node API, and Supabase option; rewrite the protocol adapter and reward-bearing event path.
- DLMM: an expansion only after DBC → DAMM v2 is complete and a real liquidity objective is defined.

### Questions to answer before M1

1. Which issuer category can we reach most credibly: emerging app/community tokens, ecosystem spinouts, or another category with a concrete pain point?
2. Which DBC config and quote asset create a clear, affordable proof of graduation and match Meteora's keeper rules?
3. What qualifies as “conviction” without rewarding easy wash trades or forcing users into risky behavior?
4. Which campaign data and payout steps can Torque currently perform, and on which network?
5. What production API/RPC/metadata hosting will we use, and what is the pilot budget?

## 9. Source of truth

- [Meteora DBC bounty and judging criteria](https://superteam.fun/earn/listing/meteora-dbc)
- [DBC overview](https://docs.meteora.ag/core-products/dbc/what-is-dbc)
- [DBC universal curve](https://docs.meteora.ag/core-products/dbc/universal-curve)
- [DBC launch configuration](https://docs.meteora.ag/core-products/dbc/launch-configurations)
- [DBC migration and liquidity](https://docs.meteora.ag/core-products/dbc/migration-and-liquidity)
- [DBC TypeScript SDK examples](https://docs.meteora.ag/developer-guides/dbc/typescript-sdk/examples)
- [DAMM v2 developer guide](https://docs.meteora.ag/developer-guides/damm-v2)
- [DLMM developer guide](https://docs.meteora.ag/developer-guides/dlmm)
- [Colosseum eligibility and submission guidance](https://colosseum.com/hackathon?year=fall2026)

**Planning rule:** update this document when a validated technical fact or user decision changes the product, implementation order, or evidence standard. Advance each milestone only when its exit evidence is recorded.

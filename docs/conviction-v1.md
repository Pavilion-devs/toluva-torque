# Conviction v1 launch recipe

This is the first self-service Meteora DBC recipe in Toluva. The creator's connected wallet pays for and signs a reusable DBC config, then signs a token pool launched from that config. The browser generates the config and mint signers. Toluva never receives their secret keys.

## Economic terms

| Term | v1 value | Reason |
| --- | --- | --- |
| Network | Solana devnet | Validate the complete lifecycle before a reviewed mainnet release. |
| Quote asset | Wrapped SOL mint `So11111111111111111111111111111111111111112` | Native SOL is easy for an independent devnet creator to source and trade. |
| Base token | SPL Token, 6 decimals, 1,000,000,000 units, immutable authority | A fixed, understandable supply with no post-launch mint or metadata control. |
| Migration threshold | 5 SOL default, creator may choose 1–100 SOL | An explicit target for testing; mainnet thresholds need separate keeper and economics review. |
| Migration supply allocation | 20% | A meaningful post-graduation liquidity allocation in the SDK curve builder. |
| Curve fee | 100 bps, flat | Simple to explain and above the DBC minimum. The protocol's own fee allocation still applies. |
| Creator trading fee percentage | 0 in DBC config; fee claimer is the creator wallet | Toluva takes no partner fee; the creator controls the configured fee claimer. |
| Pool creation fee | 0 configured | Network rent and transaction costs still apply. |
| Migration | DAMM v2, customized migration fee 0 | New DBC configs migrate to DAMM v2. This does not imply keeper eligibility. |
| DAMM v2 fee | 30 bps, dynamic fee disabled | Stable, legible post-graduation fee for the first recipe. |
| Migrated liquidity | 50% permanently locked for creator; 50% creator liquidity unlocked; 0% partner | A visible durable liquidity commitment while retaining some creator flexibility. |
| Locked token vesting | None | Keeps the first lifecycle and claim surface simple. |
| Fee claimer and leftover receiver | Connected creator wallet | No hidden Toluva-controlled recipient. Both are shown before signing and verified from the on-chain config on the public page. |

The SDK computes exact curve points and base-unit quantities from the supplied threshold. At the 5 SOL default, `migrationQuoteThreshold` is `5,000,000,000` lamports. The 1 billion token supply is `1,000,000,000,000,000` base units. `buildConvictionConfig` is the source of truth; the API returns the economic terms for UI review and the public page reads the created config on chain.

## Verification and limits

- The DBC SDK's config validator passes for this recipe. The build endpoint produces an unsigned transaction requiring the creator and generated config signer.
- Pool registration requires a confirmed DBC transaction, the expected pool PDA, matching config/mint/creator accounts and signatures from the creator and base mint. The verifier accepted a historical third-party SPL Token launch on devnet and decoded its metadata. A confirmed pool is saved under a unique route key containing its full mint, so projects can reuse a ticker.
- The first [creator-signed devnet config and token pool](meteora-proof.md) are confirmed. The decoded on-chain config matches the disclosed recipe. The new pool is readable and quotable. A wallet-signed trade and DAMM v2 graduation still need live proof.
- The creator currently supplies a public HTTPS token metadata URI. Toluva does not yet host metadata or read its image/description into the launch registry. The public page links the on-chain URI and uses a generated icon until metadata reading is built.
- Exact-input DBC quotes and unsigned buy/sell transaction builds worked against a live devnet pool; wallet signing and submission still need a live test. Migration transactions, verified campaigns and rewards are later milestones and are not shown as live features on new DBC launch pages. The [read-only validation record](meteora-readonly-validation.md) identifies the third-party pools used.

Reference: [Meteora DBC TypeScript SDK examples](https://docs.meteora.ag/developer-guides/dbc/typescript-sdk/examples), [DBC accounts and permissions](https://docs.meteora.ag/core-products/dbc/accounts-and-permissions).

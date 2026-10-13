# Toluva Launch Operator

The Launch Operator helps a creator prepare a Meteora DBC launch and understand the current state of a registered launch. It uses the existing Conviction v1 form and wallet flow. It does not create a config, launch a token, trade, or move liquidity without a person's review and wallet signature.

## Product flow

1. On **Launches → New launch**, enter a plain-language idea. `POST /api/operator/draft` returns a proposed name, symbol, description, graduation target, missing fields, unsupported requests, and the exact fixed Conviction v1 terms.
2. Choose **Use this draft**. The fields become editable in the normal launch form. Unsupported network, quote, economics, or automatic-signing requests must be revised first. The creator adds metadata or a public metadata URI, reviews the terms, and signs through the existing wallet flow.
3. On a registered launch page, **What comes next?** reads `GET /api/operator/launches/:id/report`. Guidance is derived from cached live DBC/DAMM v2 pool state, finalized swaps submitted to Toluva, persisted conviction observations, and linked DLMM state. A stale chain read results in a refresh recommendation.

When `OPENAI_API_KEY` is available server-side, drafting uses the OpenAI Responses API with a strict JSON schema and `store: false`. The user's prompt is sent to the provider. Without a key, guided field extraction remains available and is labelled as such. The operator never receives a wallet secret. Public prompts are limited to 500 characters, and AI requests have per-address and global server limits. The model can propose fields; server validation and on-chain config validation enforce supported economics. No AI-generated text is executable code.

## Public MCP endpoint

Connect an MCP client to `https://devnet.toluva.xyz/mcp` over streamable HTTP. The server exposes:

| Tool | Result |
| --- | --- |
| `list_launches` | Registered public Meteora launches on the configured network |
| `get_launch_report` | Current pool stage, progress, submitted verified trades, persisted conviction score, linked DLMM, and next review step |
| `get_launch_terms` | Terms decoded from the on-chain DBC config |
| `get_verified_activity` | Finalized DBC swaps submitted to and checked by Toluva; not a complete market index |
| `get_liquidity_market` | Linked DLMM pool and optional public wallet positions |
| `prepare_launch` | Editable Conviction v1 plan and a website handoff URL; no transaction |

Every MCP tool is read-only. `get_launch_report` scores previously persisted conviction checkpoints without recording a new observation. Position data is public on-chain data. MCP does not expose wallet signing, transaction broadcast, private API keys, or arbitrary RPC methods.

## Deployment and checks

Add `OPENAI_API_KEY` to the root-owned `/etc/toluva/api.env`; optionally set `TOLUVA_OPERATOR_MODEL`, `TOLUVA_OPERATOR_MAX_DRAFTS_PER_HOUR`, and `TOLUVA_PUBLIC_ORIGIN`. Never place the key in a `VITE_` variable, frontend build, Git, or a public MCP response. Restart the API container after updating its image. Deploy the new web build and Caddyfile so `/mcp` reaches the API.

Check `/api/operator/availability` for `aiDrafting: true`, prepare an AI draft, reject an unsupported fee request, and open a handoff URL to verify that it only fills the launch form. Check a live launch report and call MCP `tools/list` plus `prepare_launch`. Test mobile width and ensure no wallet prompt occurs until the creator explicitly submits the normal form.

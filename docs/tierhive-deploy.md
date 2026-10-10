# TierHive devnet deployment

The shared TierHive VPS already runs other services. Toluva uses its own Docker network, containers, data directory, and private backend port. TierHive HAProxy provides the public HTTPS hostname and forwards to the web container at the VPS private address on port `3013`. The web container serves the built React app and proxies `/api/*` and `/metadata/*` to the Node API; the API has no host port mapping.

## Layout

| Path or name | Purpose |
| --- | --- |
| `/opt/toluva/repo` | Reviewed source used to build the API image |
| `/opt/toluva/web/dist` | Production web build |
| `/opt/toluva/web/Caddyfile` | Static and API routing |
| `/etc/toluva/api.env` | Server-only runtime configuration |
| `/var/lib/toluva/registry/registry.json` | Durable launches, verified swaps, Conviction checkpoints |
| `/var/lib/toluva/metadata` | Content-addressed public token JSON and artwork |
| `toluva-net`, `toluva-api`, `toluva-web` | Isolated Docker resources |

Build the web app with `npm ci && npm run build` using Node 20 or newer. Production builds use the page's HTTPS origin for the API by default; `VITE_TOLUVA_API_URL` is needed only for separate hosts. Set the browser Solana network to devnet and keep private RPC credentials out of `VITE_` variables. Transfer only tracked source files and the `dist` build to the VPS. Copy the existing local registry once, before starting the API, so the pilot's immutable checkpoint is preserved. Never publish the mutable registry or the API environment file in Git.

Build `deploy/tierhive/Dockerfile.api` as the `toluva-api` image. Run it on `toluva-net` with `/etc/toluva/api.env` and `/var/lib/toluva:/var/lib/toluva`. Run `caddy:2-alpine` on that network with the supplied Caddyfile and `dist` mounted read-only, mapping only `10.3.245.2:3013:80`. Use Docker restart policies for both containers. The API environment needs:

```text
NODE_ENV=production
PORT=8787
TOLUVA_API_HOST=0.0.0.0
TOLUVA_ALLOWED_ORIGIN=https://YOUR_DEVNET_HOST
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
TOLUVA_LEGACY_API_ENABLED=false
TOLUVA_REGISTRY_PATH=/var/lib/toluva/registry/registry.json
TOLUVA_METADATA_DIR=/var/lib/toluva/metadata
TOLUVA_METADATA_PUBLIC_BASE_URL=https://YOUR_DEVNET_HOST
```

Use a dependable server-side RPC for the public trial if the shared devnet endpoint becomes unreliable. Give `/var/lib/toluva` to the container's unprivileged Node user and restrict the environment file to root. Configure the TierHive HAProxy domain to route to the VPS private address and port `3013`, then validate DNS and issue SSL. The hostname must remain live once token metadata URIs are written on chain.

## Acceptance checks

1. The web container can reach `/api/health` and the seeded registry through its proxy.
2. From outside the VPS, the HTTPS origin serves the React app and `/api/health`, and `/api/registry` returns the two existing devnet launches.
3. `/api/meteora/conviction-proof?pool=DFxmgj3i6rRsf1p13FxuvKELZ3Ktk5MVGLNcKPu8Kbaa` retains the pilot's first persisted checkpoint and 1/2 score. Do not start a fresh v2 window by losing the registry file.
4. `/api/meteora/metadata/status` reports local persistent storage. Publish a small wallet-approved metadata item through the normal form and verify its HTTPS JSON and image URLs before creating a token that points to them.
5. Confirm wallet connection and devnet quote reads in a browser. Keep the prior Toluva site untouched until this devnet trial is verified.

Back up the registry and metadata directory together, retaining the original public metadata URLs. A code update can replace the image and static build without replacing `/var/lib/toluva`. Roll back the two containers to the previous image/build if health or on-chain reads fail. Monitor uptime, disk, RPC failures, HTTPS status, and the TierHive account balance; a funded trial needs enough prepaid runtime for its observation window.

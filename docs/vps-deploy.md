# VPS rollout for the devnet product

This layout serves the existing Toluva UI and API on separate HTTPS hostnames. The API stores launch records and immutable token metadata under `/var/lib/toluva`, outside the release checkout. On-chain metadata URIs require that directory and hostname to remain available long term.

## Before deployment

- A Linux VPS reachable by SSH, with DNS records for a web hostname and an API hostname pointing to it. Use a devnet subdomain until the independent creator flow and migration are reviewed for mainnet.
- Node.js 20 or newer, `npm`, Git, and Caddy (or an equivalent TLS reverse proxy). Verify the installed Node path before using the service template; it assumes `/usr/bin/node`.
- Allow inbound 80/443 for HTTPS issuance and web traffic, and SSH for administration. Keep API port 8787 private. The service binds to `127.0.0.1` when configured as below.
- A persistent disk with backups. Preserve `/var/lib/toluva/registry` and `/var/lib/toluva/metadata` across deployments and server replacement.

## Install the app

Create a dedicated `toluva` system user, `/opt/toluva/current` checkout, and `/var/lib/toluva/{registry,metadata}` owned by that user. Clone the reviewed release branch, then run `npm ci` and `npm run build` with a supported Node version. Set these **build-time** variables before building the web app:

```text
VITE_TOLUVA_API_URL=https://api.devnet.example.org
VITE_SOLANA_CLUSTER=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

Replace the example hostnames. `VITE_` values are shipped to browsers; never put an RPC secret or service key in them. If a private RPC is used server-side, set it only in the API environment.

Copy [api.env.example](../deploy/vps/api.env.example) to `/etc/toluva/api.env`, replace the hostnames and configure a dependable Solana RPC. Make the file readable by the `toluva` service only. Keep `SUPABASE_*` unset for the persistent-volume mode. Copy [toluva-api.service.example](../deploy/vps/toluva-api.service.example) to the systemd service directory, adjust the Node path, reload systemd, then enable and start it. Copy [Caddyfile.example](../deploy/vps/Caddyfile.example) to the Caddy configuration, replace the hostnames, validate it and reload Caddy. Caddy obtains HTTPS certificates after DNS resolves.

Before replacing the laptop registry, copy the current `data/local-launch-registry.json` to the VPS registry path so the confirmed pilot and its verified trade receipts remain visible. Never put that mutable file in Git. A new installation can instead let the API create an empty registry from its seed.

## Verify before any new on-chain launch

1. Confirm the API health endpoint and launch registry are reachable through the API hostname over HTTPS.
2. Confirm `GET /api/meteora/metadata/status` reports the persistent-volume backend and `GET /api/meteora/conviction-proof?pool=<registered-pool>` reads the pilot.
3. Confirm the web hostname opens the launch page and wallet connection targets Solana devnet.
4. Publish a new small metadata item through the normal launch form. The API checks the public HTTPS image and JSON byte hashes before providing the URI. Open both URLs from a separate browser/network.
5. Run an independent creator launch with the hosted URI, then verify the registry shows its description and artwork and the on-chain token metadata points to the durable API domain.

Back up the registry and metadata directory together. A restore must preserve byte-identical metadata assets at their original URLs; those URLs are written into immutable token launches. Monitor API health, disk space, HTTPS expiry, and RPC errors. Keep deploys reversible by retaining the prior release checkout until the new build and API pass the checks above.

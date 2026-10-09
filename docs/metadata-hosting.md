# Token metadata hosting

Toluva can publish a creator's token name, symbol, description and JPEG artwork through the normal Meteora launch form. The browser asks the connected Solana wallet to sign an off-chain message covering the exact content hash, wallet, network and five-minute expiry. The API verifies that signature before storing anything. The DBC config and pool remain separate wallet transactions.

The image and JSON use SHA-256 filenames and cannot be overwritten through the API. Before returning a URI, the service checks that both assets are publicly readable and byte-for-byte identical to the approved content. The launch registry reads Toluva-hosted metadata back by hash and uses its description and image on public cards. Existing public HTTPS metadata URIs remain supported.

## Supabase Storage

Create a **public** Storage bucket for immutable token assets. Set these server-side variables:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_KEY
TOLUVA_METADATA_BUCKET=YOUR_PUBLIC_BUCKET
```

The bucket must exist before uploads. Keep its service role key on the API server; never expose it through a `VITE_` variable. Toluva uses the bucket's public asset URLs as on-chain metadata URIs. The same Supabase credentials also activate the registry's Supabase adapter, so apply [the registry schema](../scripts/supabase-schema.sql) for a public deployment.

Supabase's [upload documentation](https://supabase.com/docs/reference/javascript/file-buckets-upload) describes the existing-bucket requirement. Its [public bucket documentation](https://supabase.com/docs/guides/storage/buckets/fundamentals) explains public reads.

## Persistent API volume

If the API has a durable volume and a public HTTPS domain, it can host the same content-addressed assets itself:

```text
TOLUVA_METADATA_DIR=/absolute/path/on/persistent/volume
TOLUVA_METADATA_PUBLIC_BASE_URL=https://api.example.org
```

The API serves generated files at `https://api.example.org/metadata/images/...` and `https://api.example.org/metadata/tokens/...`. The base URL must resolve to that same API instance or a reverse proxy serving its assets. Keep the volume across deploys and backups: token metadata URIs are written on chain and cannot be repaired by editing a launch record. Do not point a launch at a temporary tunnel, laptop or ephemeral deployment filesystem.

When neither backend is configured, the form says hosting is unavailable and accepts an existing public HTTPS token JSON URI. It does not invent a placeholder URI. The hosting status endpoint is `GET /api/meteora/metadata/status`; the signed flow uses `POST /api/meteora/metadata/challenge` and `POST /api/meteora/metadata/publish`. JPEG artwork is limited to 256 KB after browser compression; the API rejects oversized requests.

# Railway Deployment Guide

## Steps

### 1. Go to railway.app

New Project → Deploy from GitHub repo → select `Pavilion-devs/toluva-torque`.

### 2. Set the start command

Service → Settings → Deploy → Start Command:

```
node server/index.js
```

### 3. Add environment variables

In the service → Variables tab, add:

```
TORQUE_EVENT_API_KEY=
TORQUE_PROJECT_ID=
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
TOLUVA_ALLOWED_ORIGIN=*
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TOLUVA_METADATA_BUCKET=
```

Do not set `PORT` — Railway injects it automatically.

For Toluva-hosted token metadata, create a public Supabase Storage bucket and set `TOLUVA_METADATA_BUCKET`. The service role key stays on Railway. See [metadata-hosting.md](metadata-hosting.md). Do not use Railway's ephemeral filesystem for on-chain metadata URIs; a persistent volume plus a public HTTPS API domain is required for the local-file backend.

### 4. Deploy

Railway will build and deploy automatically on every push to `main`.

### 5. Get the Railway URL

Copy the public domain from the service dashboard. It looks like:

```
https://toluva-torque-production.up.railway.app
```

Verify it's live:

```bash
curl https://your-railway-url.up.railway.app/api/health
```

Expected response:

```json
{ "ok": true, "service": "toluva-api" }
```

### 6. Add the URL to Vercel

Vercel → project → Settings → Environment Variables:

```
VITE_TOLUVA_API_URL=https://your-railway-url.up.railway.app
```

Redeploy on Vercel after adding it.

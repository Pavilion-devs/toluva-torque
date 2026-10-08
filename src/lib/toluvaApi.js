export const apiBaseUrl = import.meta.env.VITE_TOLUVA_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:8787" : null);

export function requireApiBaseUrl() {
  if (!apiBaseUrl) {
    throw new Error("Toluva API is not configured. Run `npm run dev` or set VITE_TOLUVA_API_URL.");
  }

  return apiBaseUrl;
}

export async function getJson(path) {
  const response = await fetch(`${requireApiBaseUrl()}${path}`, {
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `${path} returned ${response.status}.`);
  return payload;
}

export async function fetchLeaderboard() {
  const data = await getJson("/api/torque/leaderboard");
  return data?.data?.results || [];
}

export async function fetchClaimDetails(wallet) {
  if (!wallet) return [];
  const data = await getJson(`/api/torque/claim-details?wallet=${encodeURIComponent(wallet)}`);
  return data?.data || [];
}

export async function triggerClaim(wallet) {
  return postJson("/api/torque/claim", { wallet });
}

export async function postJson(path, body) {
  const response = await fetch(`${requireApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error || `${path} returned ${response.status}.`);
    error.payload = payload;
    throw error;
  }

  return payload;
}

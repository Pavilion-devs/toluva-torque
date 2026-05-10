export const apiBaseUrl = import.meta.env.VITE_TOLUVA_API_URL || "http://127.0.0.1:8787";

export function requireApiBaseUrl() {
  if (!apiBaseUrl) {
    throw new Error("Toluva API is not configured. Run `npm run dev` or set VITE_TOLUVA_API_URL.");
  }

  return apiBaseUrl;
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

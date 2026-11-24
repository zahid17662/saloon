// Browser-side client for the Salon API. Requests go to /api/*, which next.config.ts rewrites to the
// backend, so the session cookies the backend sets belong to this site (no CORS, no cross-site cookies).
//
// Every endpoint answers { ok: true, data } or { ok: false, error } (a Bangla message to show).
// A network failure or a reply that is not that shape throws, and callers show NET_ERR.

import { refreshAll } from "@/app/refresh";

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };
/** Login-style calls carry no data. */
export type AuthResult = { ok: true } | { ok: false; error: string };

export async function request<R extends { ok: boolean }>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<R> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
    cache: "no-store",
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* handled below */
  }
  if (!json || typeof json !== "object" || typeof (json as { ok?: unknown }).ok !== "boolean") {
    throw new Error("unexpected API reply");
  }
  const result = json as R;
  if (result.ok && method !== "GET") {
    // Cookie changes (unlock, login, logout, new codes) must be visible before the caller navigates.
    // Data writes refresh in the background so the screen does not wait for it.
    if (path.startsWith("/auth/")) await refreshAll().catch(() => {});
    else void refreshAll().catch(() => {});
  }
  return result;
}

export function withQuery(path: string, query: unknown): string {
  const params = new URLSearchParams();
  if (query && typeof query === "object") {
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null) params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `${path}?${s}` : path;
}

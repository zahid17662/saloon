import "server-only";

import { cookies } from "next/headers";

// Server-side access to the Salon API (the backend/ app). Used by server components and layouts to
// load data on the server; the visitor's own cookies are forwarded so the backend authorises the
// request exactly as it would a browser call. Browser code never imports this: it calls /api/* through
// the rewrite in next.config.ts (see src/api/).

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

/** The API said "not logged in" (shop device or admin session missing, expired or revoked). */
export class BackendUnauthorized extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "BackendUnauthorized";
  }
}

/**
 * GETs `/api{path}` and returns the `data` of an `{ ok: true, data }` reply.
 * Throws BackendUnauthorized on 401; any other failure throws a plain Error with no details in the
 * message (replies and URLs can carry hostnames).
 */
export async function backendData<T>(path: string): Promise<T> {
  const cookie = (await cookies())
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    headers: { cookie, accept: "application/json" },
    cache: "no-store",
  });
  if (res.status === 401) throw new BackendUnauthorized();
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* not JSON: handled below */
  }
  if (res.ok && body && typeof body === "object" && (body as { ok?: unknown }).ok === true) {
    return (body as { data: T }).data;
  }
  throw new Error(`backend request failed (${res.status})`);
}

export interface SessionStatus {
  shop: boolean;
  admin: boolean;
}

export const backendSession = () => backendData<SessionStatus>("/auth/session");

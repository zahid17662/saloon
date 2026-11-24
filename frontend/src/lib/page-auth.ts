import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { backendData, backendSession, BackendUnauthorized } from "./backend";

// Auth for server-rendered pages. proxy.ts already redirects visitors with no cookie; these also
// cover a session that expired or was revoked (shop code changed) between the redirect check and
// the render, by sending the visitor to the right login instead of showing the error page.
// The check itself is the backend's (/api/auth/session); `connection()` marks the page as
// request-time work.

/** Barber screens: an unlocked shop device, or an admin session (admin login also unlocks). */
export async function ensureShop(): Promise<void> {
  await connection();
  const s = await backendSession();
  if (!s.shop && !s.admin) redirect("/unlock");
}

/** Loads shop-gated data from the API; a session that just expired sends the visitor to /unlock. */
export async function shopData<T>(path: string): Promise<T> {
  try {
    return await backendData<T>(path);
  } catch (e) {
    if (e instanceof BackendUnauthorized) redirect("/unlock");
    throw e;
  }
}

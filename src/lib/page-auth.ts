import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AuthError, requireAdmin, requireShop } from "./auth";

// Auth for server-rendered pages. proxy.ts already redirects visitors with no cookie; these also
// cover a session that expired or was revoked (shop code changed) between the redirect check and
// the render, by sending the visitor to the right login instead of showing the error page.
// `connection()` marks the page as request-time work (it compares cookies with the clock).

export async function ensureShop(): Promise<void> {
  await connection();
  try {
    await requireShop();
  } catch (e) {
    if (e instanceof AuthError) redirect("/unlock");
    throw e;
  }
}

export async function ensureAdmin(): Promise<void> {
  await connection();
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) redirect("/admin/login");
    throw e;
  }
}

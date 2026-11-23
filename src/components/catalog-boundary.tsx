import "server-only";

import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { db } from "@/db";
import { AuthError, requireShop } from "@/lib/auth";
import { getCatalog } from "@/server/catalog";
import { CatalogProvider } from "./catalog-context";
import { LoadingScreen } from "./ui";

/**
 * Loads the catalog (categories, services, barbers, public settings) from Neon for visitors with a
 * valid shop or admin session, and hands it to the client tree. Visitors without a session (the
 * /unlock page) get null; proxy.ts has already redirected everything else.
 * Reads cookies, so it must sit behind Suspense (Cache Components).
 */
async function Loader({ children }: { children: ReactNode }) {
  // Session expiry compares against Date.now(), so this must be treated as request-time work.
  await connection();
  let catalog = null;
  try {
    await requireShop();
    catalog = await getCatalog(db);
  } catch (e) {
    if (!(e instanceof AuthError)) throw e; // a database outage must reach error.tsx, not look like "logged out"
  }
  return <CatalogProvider catalog={catalog}>{children}</CatalogProvider>;
}

export function CatalogBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Loader>{children}</Loader>
    </Suspense>
  );
}

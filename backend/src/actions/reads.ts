// Read-only endpoints the frontend needs on top of the write actions: session status, the catalog,
// the public shop name and the barber/receipt screens' data. These used to run inside Next.js pages
// (server components talking to the database directly); now the frontend asks this API instead.

import { db } from "@/db";
import { hasValidAdminSession, hasValidShopSession, requireShop } from "@/lib/auth";
import { idSchema } from "@/lib/schemas";
import type { Sale } from "@/lib/types";
import { parseInput, runAction, type ActionResult } from "@/server/action";
import * as catalog from "@/server/catalog";
import * as sales from "@/server/sales";

const FALLBACK_SHOP_NAME = "সেলুন";

export interface SessionStatus {
  shop: boolean;
  admin: boolean;
}

/** Whether the request carries a valid shop-device cookie and/or admin cookie (signature, expiry, DB version). */
export async function getSessionStatus(): Promise<SessionStatus> {
  const [shop, admin] = await Promise.all([hasValidShopSession(), hasValidAdminSession()]);
  return { shop, admin };
}

/** Categories, services, barbers and public settings, for a shop device or an admin session. */
export async function getCatalogView(): Promise<ActionResult<catalog.Catalog>> {
  return runAction(async () => {
    await requireShop();
    return catalog.getCatalog(db);
  });
}

/** Public (no login): the shop name for the unlock page and the browser tab title. */
export async function getPublicShopName(): Promise<{ shopName: string }> {
  try {
    return { shopName: (await catalog.getSettings(db)).shopName.trim() || FALLBACK_SHOP_NAME };
  } catch {
    return { shopName: FALLBACK_SHOP_NAME }; // database unreachable: the form should still show
  }
}

export async function getTodayStats(): Promise<ActionResult<Awaited<ReturnType<typeof sales.todayStats>>>> {
  return runAction(async () => {
    await requireShop();
    return sales.todayStats(db);
  });
}

export async function getBarberSalesToday(barberId: unknown): Promise<ActionResult<Sale[]>> {
  return runAction(async () => {
    await requireShop();
    return sales.barberSalesToday(db, parseInput(idSchema, barberId));
  });
}

export async function getSaleById(id: unknown): Promise<ActionResult<Sale | null>> {
  return runAction(async () => {
    await requireShop();
    return sales.getSale(db, parseInput(idSchema, id));
  });
}

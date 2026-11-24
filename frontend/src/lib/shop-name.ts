import "server-only";
import { backendData } from "./backend";

export const FALLBACK_SHOP_NAME = "সেলুন";

/** The shop name from Settings, or null when it is empty or the API is unreachable. */
export async function fetchShopName(): Promise<string | null> {
  try {
    const { shopName } = await backendData<{ shopName: string }>("/public/shop-name");
    return shopName.trim() || null;
  } catch {
    return null; // API unreachable: callers fall back so the page still renders
  }
}

/** The shop name for the public unlock and admin-login pages (it is also the browser tab title). */
export async function publicShopName(): Promise<string> {
  return (await fetchShopName()) ?? FALLBACK_SHOP_NAME;
}

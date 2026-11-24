import "server-only";
import { backendData } from "./backend";
import type { PublicMenu } from "./types";

/** The customer landing page's data. Public endpoint only: no session, no commissions, no sales. */
export async function fetchPublicMenu(): Promise<PublicMenu | null> {
  try {
    return await backendData<PublicMenu>("/public/menu");
  } catch {
    return null; // API unreachable: the page shows a friendly message instead of the error screen
  }
}

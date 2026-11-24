"use server";

import { revalidatePath } from "next/cache";

/**
 * Called by the API client after a successful write. Invalidating the layout makes Next re-render the
 * server components (catalog, today's stats, receipts) and drop the browser's cached copies, so every
 * screen shows the change. This is the only Server Action left in the frontend; it touches no data.
 */
export async function refreshAll(): Promise<void> {
  revalidatePath("/", "layout");
}

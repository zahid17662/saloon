// Owner backup download (Settings). Admin session required: proxy.ts redirects /admin/* without a
// cookie and this handler re-checks on the server. Never cached.

import { db } from "@server/db";
import { AuthError, requireAdmin } from "@server/lib/auth";
import { todayKey } from "@server/lib/time";
import { exportBackup } from "@server/server/backup";

export async function GET(): Promise<Response> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return new Response("Unauthorized", { status: 401, headers: { "cache-control": "no-store" } });
    throw e;
  }
  const data = await exportBackup(db);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="salon-backup-${todayKey()}.json"`,
      "cache-control": "no-store",
    },
  });
}

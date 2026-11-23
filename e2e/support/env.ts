// Loads .env.test and refuses to continue unless the target database is clearly the E2E branch.
// The tests DELETE sales, payouts and the whole menu, so a wrong database would be destructive.
// Values are never printed.

import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";

/** "postgresql://u:p@ep-abc-123-pooler.region.aws.neon.tech/db" -> "ep-abc-123" */
export function endpointOf(url: string): string {
  const host = new URL(url).hostname;
  return host.split(".")[0].replace(/-pooler$/, "");
}

let loaded = false;

export function loadE2eEnv(): void {
  if (loaded) return;
  if (!existsSync(".env.test")) {
    throw new Error("E2E: .env.test not found. Copy .env.test.example to .env.test and fill it in (see the comments inside).");
  }
  const test = parse(readFileSync(".env.test"));
  const local = existsSync(".env.local") ? parse(readFileSync(".env.local")) : {};

  const url = test.DATABASE_URL;
  const expected = test.E2E_ENDPOINT;
  if (!url || !expected) throw new Error("E2E: .env.test must define DATABASE_URL and E2E_ENDPOINT.");
  if (!/^ep-[a-z0-9-]+$/.test(expected)) throw new Error("E2E: E2E_ENDPOINT must look like ep-xxxxxxxx (no -pooler).");
  if (endpointOf(url) !== expected) throw new Error("E2E: DATABASE_URL does not belong to E2E_ENDPOINT. Refusing to run.");
  for (const other of [local.DATABASE_URL, local.DIRECT_URL, process.env.DATABASE_URL]) {
    if (other && endpointOf(other) === expected) {
      throw new Error("E2E: E2E_ENDPOINT is the same database as .env.local (dev). Use a separate Neon branch. Refusing to run.");
    }
  }
  // .env.test wins over anything else (Next gives real environment variables priority over .env.local).
  for (const [k, v] of Object.entries(test)) process.env[k] = v;
  loaded = true;
}

export const shopCode = () => process.env.E2E_SHOP_CODE ?? "1234";
export const adminPin = () => process.env.E2E_ADMIN_PIN ?? "0000";

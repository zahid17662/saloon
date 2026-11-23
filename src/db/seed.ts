/**
 * Idempotent seed: `npm run db:seed`.
 *
 * - Reuses the data in src/lib/seed.ts (categories, 25 services, 3 barbers, settings).
 * - Admin PIN and shop code are stored as bcrypt hashes, never plaintext.
 * - Each table is seeded only if it is empty; settings use ON CONFLICT DO NOTHING.
 *   Re-running creates no duplicates and never overwrites a PIN/shop code that was changed later.
 * - Everything runs in one transaction.
 *
 * Env: DIRECT_URL (or DATABASE_URL). Optional: SEED_ADMIN_PIN, SEED_SHOP_CODE.
 *      SEED_ENV=production requires both to be set explicitly (no demo fallback).
 */
import { config } from "dotenv";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { DEMO_ADMIN_PIN, DEMO_SHOP_CODE, INITIAL_SHOP_CODE_VERSION, createSeed } from "../lib/seed";
import { barbers, categories, services, settings } from "./schema";

config({ path: ".env.local" });

const BCRYPT_COST = 12;

function endpointId(url: string): string {
  // Only the Neon endpoint id (ep-xxxx), never credentials, so it can be compared to the console.
  const host = new URL(url).hostname;
  return host.split(".")[0].replace(/-pooler$/, "");
}

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL or DATABASE_URL is not set");

  const data = createSeed();
  const isProd = process.env.SEED_ENV === "production";
  const pin = process.env.SEED_ADMIN_PIN ?? (isProd ? undefined : DEMO_ADMIN_PIN);
  const shopCode = process.env.SEED_SHOP_CODE ?? (isProd ? undefined : DEMO_SHOP_CODE);
  if (!pin || !shopCode) {
    throw new Error("SEED_ENV=production requires SEED_ADMIN_PIN and SEED_SHOP_CODE");
  }

  console.log(`Seeding Neon endpoint: ${endpointId(url)}`);

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  try {
    const [adminPinHash, shopCodeHash] = await Promise.all([
      bcrypt.hash(pin, BCRYPT_COST),
      bcrypt.hash(shopCode, BCRYPT_COST),
    ]);

    const result = await db.transaction(async (tx) => {
      const out = { categories: 0, services: 0, barbers: 0, settings: 0 };

      const [{ n: catCount }] = await tx.select({ n: count() }).from(categories);
      if (catCount === 0) {
        for (const c of data.categories) {
          await tx
            .insert(categories)
            .values({ name: c.name, sortOrder: c.sortOrder, active: c.active });
          out.categories++;
        }
      }

      const [{ n: svcCount }] = await tx.select({ n: count() }).from(services);
      if (svcCount === 0) {
        const catRows = await tx.select().from(categories);
        const idByName = new Map(catRows.map((r) => [r.name, r.id]));
        const seedCatName = new Map(data.categories.map((c) => [c.id, c.name]));
        const rows = data.services.map((s) => {
          const categoryId = idByName.get(seedCatName.get(s.categoryId) ?? "");
          if (categoryId === undefined) {
            throw new Error(`Category missing for service "${s.name}"`);
          }
          return {
            categoryId,
            name: s.name,
            price: s.price,
            sortOrder: s.sortOrder,
            active: s.active,
          };
        });
        await tx.insert(services).values(rows);
        out.services = rows.length;
      }

      const [{ n: barberCount }] = await tx.select({ n: count() }).from(barbers);
      if (barberCount === 0) {
        const rows = data.barbers.map((b) => ({
          name: b.name,
          commissionPct: b.commissionPct,
          sortOrder: b.sortOrder,
          active: b.active,
        }));
        await tx.insert(barbers).values(rows);
        out.barbers = rows.length;
      }

      const s = data.settings;
      const settingRows = [
        { key: "shopName", value: s.shopName },
        { key: "shopAddress", value: s.shopAddress },
        { key: "shopPhone", value: s.shopPhone },
        { key: "receiptFooter", value: s.receiptFooter },
        { key: "paperWidth", value: s.paperWidth },
        { key: "adminPinHash", value: adminPinHash },
        { key: "shopCodeHash", value: shopCodeHash },
        { key: "shopCodeVersion", value: String(INITIAL_SHOP_CODE_VERSION) },
      ];
      const inserted = await tx
        .insert(settings)
        .values(settingRows)
        .onConflictDoNothing({ target: settings.key })
        .returning({ key: settings.key });
      out.settings = inserted.length;

      return out;
    });

    console.log("Inserted this run:", result);
    console.log("(0 means that table was already seeded; nothing was changed.)");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  // Name only: a driver error message can echo connection details.
  console.error("Seed failed:", err instanceof Error ? err.name : "unknown error");
  process.exit(1);
});

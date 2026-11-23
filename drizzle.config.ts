import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't load Next's .env.local on its own.
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    // Direct (non-pooler) connection for migrations; fall back to DATABASE_URL.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});

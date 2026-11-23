import { loadE2eEnv } from "./env";
import { saleCount } from "./db";

// Fails fast (before the slow build) if .env.test is missing/unsafe or the database is unreachable.
export default async function globalSetup(): Promise<void> {
  loadE2eEnv();
  await saleCount();
}

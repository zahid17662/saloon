// `npm run e2e:init`: after you paste the E2E branch's pooled DATABASE_URL into .env.test, this fills in
// E2E_ENDPOINT and E2E_CONFIRM_RESET from it and refuses if it is the same database as backend/.env.local (dev).
// Prints only the endpoint id (ep-...), never the connection string.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parse } from "dotenv";

if (!existsSync(".env.test")) throw new Error(".env.test not found");
const raw = readFileSync(".env.test", "utf8");
const env = parse(raw);
const readEnv = (p) => (existsSync(p) ? parse(readFileSync(p)) : {});
const local = { ...readEnv("../backend/.env.local"), ...readEnv(".env.local") };

const endpoint = (url) => new URL(url).hostname.split(".")[0].replace(/-pooler$/, "");

if (!env.DATABASE_URL) throw new Error("Paste the pooled connection string after DATABASE_URL= in .env.test first.");
const ep = endpoint(env.DATABASE_URL);
if (!/^ep-[a-z0-9-]+$/.test(ep)) throw new Error("DATABASE_URL does not look like a Neon connection string.");
for (const dev of [local.DATABASE_URL, local.DIRECT_URL]) {
  if (dev && endpoint(dev) === ep) throw new Error("That is your dev database (backend/.env.local). Create a separate Neon branch for E2E.");
}

const set = (text, key, value) =>
  new RegExp(`^${key}=.*$`, "m").test(text) ? text.replace(new RegExp(`^${key}=.*$`, "m"), `${key}=${value}`) : `${text}\n${key}=${value}\n`;
writeFileSync(".env.test", set(set(raw, "E2E_ENDPOINT", ep), "E2E_CONFIRM_RESET", ep));

console.log(`E2E endpoint: ${ep}`);
console.log("Check that this id is your dedicated E2E branch in the Neon console (NOT main, NOT dev).");

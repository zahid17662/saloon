// `npm run build`: apply pending migrations, then build.
//
// Migrations run ONLY for Vercel Production builds (VERCEL_ENV=production). Local builds, CI builds
// and Preview deployments skip them, so a pull request can never change the real database.
// If a migration fails, the build fails and Vercel keeps serving the previous deployment.
//
// Migrations must be backward compatible (add things, never rename/drop in the same release):
// the old code keeps serving traffic against the new schema until the new deployment goes live.

import { spawnSync } from "node:child_process";

function run(label, command) {
  console.log(`\n> ${label}`);
  const r = spawnSync(command, { stdio: "inherit", shell: true });
  if (r.status !== 0) {
    console.error(`\n${label} failed (exit ${r.status ?? "signal"}). Build stopped.`);
    process.exit(r.status ?? 1);
  }
}

if (process.env.VERCEL_ENV === "production") {
  if (!process.env.DIRECT_URL && !process.env.DATABASE_URL) {
    console.error("DIRECT_URL (preferred) or DATABASE_URL must be set for Production builds.");
    process.exit(1);
  }
  run("drizzle-kit migrate (production)", "npx drizzle-kit migrate --config Server/drizzle.config.ts");
} else {
  console.log("Skipping migrations (only Vercel Production builds run them).");
}

run("next build", "npx next build Client");

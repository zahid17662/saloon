// `npm run publish:split [-- --dry-run]`: publishes Client/ to the frontend repo and Server/ to the
// backend repo. Each repo gets the folder's files at its root, as one new commit on top of the
// existing history (a normal push, never forced; if the remote moved on, git refuses and you decide).
//
// Only files git can see (tracked or untracked, minus .gitignore) are copied, so .env*, node_modules
// and build output can never be published.

import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const TARGETS = [
  { dir: "Client", repo: "https://github.com/zahid17662/saloon_software_frontend.git" },
  { dir: "Server", repo: "https://github.com/zahid17662/saloon_software_backend.git" },
];
const dryRun = process.argv.includes("--dry-run");

function git(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed:\n${r.stderr || r.stdout}`);
  return r.stdout;
}

const root = git(process.cwd(), "rev-parse", "--show-toplevel").trim();
const head = git(root, "rev-parse", "--short", "HEAD").trim();
const work = mkdtempSync(path.join(os.tmpdir(), "salon-publish-"));

try {
  for (const { dir, repo } of TARGETS) {
    console.log(`\n== ${dir} -> ${repo}`);
    const clone = path.join(work, dir);
    git(work, "clone", "--quiet", repo, clone);

    // Replace the clone's working tree (everything except .git) with the folder's visible files.
    for (const f of readdirSync(clone)) if (f !== ".git") rmSync(path.join(clone, f), { recursive: true, force: true });
    const files = git(root, "ls-files", "-co", "--exclude-standard", "--", dir)
      .split("\n")
      .filter(Boolean);
    for (const f of files) {
      const rel = path.relative(dir, f);
      const dest = path.join(clone, rel);
      mkdirSync(path.dirname(dest), { recursive: true });
      cpSync(path.join(root, f), dest);
    }
    console.log(`${files.length} files copied`);

    git(clone, "add", "-A");
    const changed = git(clone, "status", "--porcelain").trim();
    if (!changed) {
      console.log("already up to date, nothing to commit");
      continue;
    }
    console.log(changed.split("\n").slice(0, 12).join("\n") + (changed.split("\n").length > 12 ? "\n..." : ""));
    if (dryRun) {
      console.log("(dry run: not committing or pushing)");
      continue;
    }
    git(
      clone,
      "commit",
      "--quiet",
      "-m",
      `chore: publish ${dir}/ from the dev meta-repo (${head})`,
      "-m",
      "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>",
    );
    git(clone, "push", "origin", "HEAD");
    console.log("pushed");
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

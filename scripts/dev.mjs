// Starts both the backend API (`Server/`, :4000) and the Next.js frontend (`Client/`, :3000)
// for local development with `npm run dev`.

import { spawn, spawnSync } from "node:child_process";

const procs = [];
let shuttingDown = false;

function killAll(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of procs) {
    if (!child.pid || child.killed) continue;
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  }
  process.exit(code);
}

function pipePrefixed(stream, prefix, target) {
  let buf = "";
  stream.on("data", (chunk) => {
    buf += chunk.toString("utf8");
    const lines = buf.split(/\r?\n/);
    buf = lines.pop() ?? "";
    for (const line of lines) {
      target.write(`${prefix} ${line}\n`);
    }
  });
  stream.on("end", () => {
    if (buf) target.write(`${prefix} ${buf}\n`);
  });
}

function start(name, args) {
  const isWin = process.platform === "win32";
  const child = isWin
    ? spawn("cmd.exe", ["/d", "/s", "/c", "npm", ...args], { stdio: ["ignore", "pipe", "pipe"] })
    : spawn("npm", args, { stdio: ["ignore", "pipe", "pipe"] });
  procs.push(child);
  pipePrefixed(child.stdout, `[${name}]`, process.stdout);
  pipePrefixed(child.stderr, `[${name}]`, process.stderr);
  child.on("exit", (code) => {
    if (!shuttingDown) {
      console.error(`[${name}] exited with code ${code ?? 1}`);
      killAll(code ?? 1);
    }
  });
}

process.on("SIGINT", () => killAll(0));
process.on("SIGTERM", () => killAll(0));

start("api", ["run", "dev", "-w", "Server"]);
start("web", ["run", "dev", "-w", "Client"]);

// Source-level and header checks for the frontend. They read the files in this folder (pages,
// components, next.config.ts and the built client bundle); the API attacks live in
// backend/src/server/security.test.ts.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parse as parseEnv } from "dotenv";
import { describe, expect, it, vi } from "vitest";

describe("5. pages and receipts", () => {
  it("every page that shows barber or receipt data calls the shop/admin guard (receipt id in the URL is shop-gated)", () => {
    const root = path.join(process.cwd(), "src/app");
    const pages = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = path.join(dir, f);
        return statSync(p).isDirectory() ? pages(p) : f === "page.tsx" ? [p] : [];
      });
    const offenders: string[] = [];
    for (const p of pages(root)) {
      const rel = path.relative(root, p).replaceAll("\\", "/");
      const src = readFileSync(p, "utf8");
      if (rel === "unlock/page.tsx" || rel === "admin/login/page.tsx") continue;
      // The admin pages are data-free client shells (their data comes through admin-only actions,
      // proven in section 1). Any page that reads the database itself must call a guard.
      const readsData = /from "@\/lib\/backend"/.test(src);
      const guarded = rel.startsWith("admin/") ? /ensureAdmin|requireAdmin/.test(src) : /ensureShop|requireShop/.test(src);
      if (readsData && !guarded) offenders.push(rel);
    }
    expect(offenders).toEqual([]);
  });

  it("the customer receipt never shows the barber/owner split (FR-14)", () => {
    const src = readFileSync(path.join(process.cwd(), "src/components/receipt-view.tsx"), "utf8");
    expect(src).not.toMatch(/barberShare|ownerShare|commissionPct/);
  });
});

describe("6. output safety", () => {
  it("no component or page uses an HTML-injection sink (dangerouslySetInnerHTML, innerHTML, document.write, eval)", () => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = path.join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(tsx?|jsx?)$/.test(f) && !/\.test\./.test(f)) {
          const src = readFileSync(p, "utf8");
          if (/dangerouslySetInnerHTML|\.innerHTML|\.outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function\(/.test(src)) hits.push(path.relative(process.cwd(), p));
        }
      }
    };
    walk(path.join(process.cwd(), "src"));
    expect(hits).toEqual([]);
  });
});

// =====================================================================================
// 7. Security headers and bundle secrets
// =====================================================================================

describe("7. headers and secrets", () => {
  async function loadHeaders(env: "production" | "development") {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", env);
    const cfg = (await import("../next.config")).default;
    const rules = await cfg.headers!();
    const rule = rules.find((r) => r.source === "/:path*");
    return Object.fromEntries((rule?.headers ?? []).map((h) => [h.key.toLowerCase(), h.value]));
  }

  it("the header rule matches every path (source /:path*) and carries all the required headers", async () => {
    const h = await loadHeaders("production");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["strict-transport-security"]).toMatch(/max-age=\d{8,}/);
    expect(h["permissions-policy"]).toMatch(/camera=\(\).*microphone=\(\).*geolocation=\(\)/);
    expect(h["content-security-policy"]).toBeTruthy();
  });

  it("production CSP: self only, no eval, no framing, no plugins, no foreign form targets, upgrades http", async () => {
    const csp = (await loadHeaders("production"))["content-security-policy"];
    for (const d of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "upgrade-insecure-requests", "connect-src 'self'"]) {
      expect(csp, d).toContain(d);
    }
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/https?:\/\/|\*/); // no third-party origins or wildcards
    expect(csp).not.toMatch(/ws:|wss:/);
  });

  const staticDir = path.join(process.cwd(), ".next/static");
  it.skipIf(!existsSync(staticDir))("the built client bundle contains no env var names, connection strings or secret values", () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = path.join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(js|css|html|json|map|txt)$/.test(f)) files.push(p);
      }
    };
    walk(staticDir);
    expect(files.length).toBeGreaterThan(0);
    const blob = files.map((f) => readFileSync(f, "utf8")).join("\n");

    for (const needle of ["DATABASE_URL", "DIRECT_URL", "SESSION_SECRET", "SEED_ADMIN_PIN", "SEED_SHOP_CODE", "TRUST_PROXY_HEADERS", "neon.tech", "postgres://", "postgresql://", "adminPinHash", "shopCodeHash", "bcryptjs"]) {
      expect(blob.includes(needle), `client bundle contains "${needle}"`).toBe(false);
    }

    // The actual values from the local env files (never printed: only a boolean is asserted).
    const secrets: string[] = [];
    for (const f of [".env.local", ".env.test", ".env", ".env.production", "../backend/.env.local", "../backend/.env"]) {
      const p = path.join(process.cwd(), f);
      if (!existsSync(p)) continue;
      const env = parseEnv(readFileSync(p));
      for (const [k, v] of Object.entries(env)) {
        if (/SECRET|PASSWORD|PIN|URL|KEY|TOKEN|CODE/i.test(k) && v.length >= 8) secrets.push(v);
        if (/URL/i.test(k)) {
          try {
            secrets.push(new URL(v).hostname); // the database host name
          } catch {}
        }
      }
    }
    for (const s of new Set(secrets)) expect(blob.includes(s), "a secret value from an .env file is in the client bundle").toBe(false);
  });
});

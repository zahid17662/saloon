// Per-request cookie jar and headers, available to the auth code without passing `req`/`res` through
// every function. The Express layer wraps each request in `runWithContext`; tests fake this module.
//
// The shape deliberately mirrors what Next's `cookies()` / `headers()` returned before the backend was
// split from the frontend, so lib/auth.ts and the actions stayed almost unchanged.

import { AsyncLocalStorage } from "node:async_hooks";
import type { Request, Response } from "express";

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  /** Seconds, like the `Max-Age` attribute. */
  maxAge?: number;
  expires?: Date;
}

export interface CookieJar {
  get(name: string): { name: string; value: string } | undefined;
  set(name: string, value: string, options: CookieOptions): void;
}

export interface RequestContext {
  cookies: CookieJar;
  headers: Headers;
}

const store = new AsyncLocalStorage<RequestContext>();

export const runWithContext = <T>(ctx: RequestContext, fn: () => T): T => store.run(ctx, fn);

function current(): RequestContext {
  const ctx = store.getStore();
  if (!ctx) throw new Error("No request context: call this inside runWithContext");
  return ctx;
}

export async function cookies(): Promise<CookieJar> {
  return current().cookies;
}

export async function headers(): Promise<Headers> {
  return current().headers;
}

// ---------- Express adapter ----------

function parseCookieHeader(raw: string | undefined): Map<string, string> {
  const out = new Map<string, string>();
  if (!raw) return out;
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const name = part.slice(0, i).trim();
    if (!name || out.has(name)) continue; // first one wins, like a browser would send the most specific first
    const value = part.slice(i + 1).trim();
    try {
      out.set(name, decodeURIComponent(value));
    } catch {
      out.set(name, value);
    }
  }
  return out;
}

export function contextFromExpress(req: Request, res: Response): RequestContext {
  const incoming = parseCookieHeader(req.headers.cookie);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === "string") headers.set(k, v);
    else if (Array.isArray(v)) headers.set(k, v.join(", "));
  }
  return {
    headers,
    cookies: {
      get: (name) => (incoming.has(name) ? { name, value: incoming.get(name)! } : undefined),
      set: (name, value, o) => {
        incoming.set(name, value);
        res.cookie(name, value, {
          httpOnly: o.httpOnly,
          secure: o.secure,
          sameSite: o.sameSite,
          path: o.path,
          // Express wants milliseconds.
          maxAge: o.maxAge === undefined ? undefined : o.maxAge * 1000,
          ...(o.maxAge === undefined && o.expires ? { expires: o.expires } : {}),
        });
      },
    },
  };
}

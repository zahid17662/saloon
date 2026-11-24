import "server-only";

import { BACKEND_URL } from "./backend";

// Forwards a browser request to the Salon API and streams the answer back, so the browser only ever
// talks to this site: the session cookies the API sets belong to this origin (no CORS, no
// cross-site cookies) and BACKEND_URL stays private.
//
// It also passes the client address on. The API rate-limits logins per client IP and, in production,
// refuses to guess one, so the address the platform (Vercel, your reverse proxy) put on this request
// is forwarded explicitly; a plain Next rewrite does not do that.

// Headers that describe one hop, or that the fetch below recomputes.
const SKIP_REQUEST = new Set(["host", "connection", "content-length", "accept-encoding", "transfer-encoding", "x-forwarded-for", "x-real-ip", "x-forwarded-host"]);
const SKIP_RESPONSE = new Set(["connection", "keep-alive", "transfer-encoding", "content-encoding", "content-length", "set-cookie"]);

export async function forwardToBackend(req: Request, backendPath: string): Promise<Response> {
  const search = new URL(req.url).search;
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!SKIP_REQUEST.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set("accept-encoding", "identity");

  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) {
    headers.set("x-real-ip", ip);
    headers.set("x-forwarded-for", ip);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}${backendPath}${search}`, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    // API unreachable: same JSON shape as every other failure, so the screens show their usual message.
    return Response.json({ ok: false, error: "সংযোগে সমস্যা হয়েছে, আবার চেষ্টা করুন" }, { status: 502 });
  }

  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!SKIP_RESPONSE.has(key.toLowerCase())) out.set(key, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) out.append("set-cookie", cookie);
  out.set("cache-control", "no-store");
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

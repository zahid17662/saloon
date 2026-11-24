import { forwardToBackend } from "@/lib/backend-proxy";

// Every /api/* call from the browser goes to the Salon API (backend/). See lib/backend-proxy.ts.
// The API authorises each request itself; nothing is decided here.

function handler(req: Request): Promise<Response> {
  return forwardToBackend(req, new URL(req.url).pathname);
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;

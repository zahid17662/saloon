import { forwardToBackend } from "@/lib/backend-proxy";

// Owner backup download (Settings links here). proxy.ts redirects /admin/* without a session cookie,
// and the API re-checks the admin session before it sends anything. Never cached.
export function GET(req: Request): Promise<Response> {
  return forwardToBackend(req, "/api/admin/backup");
}

import { Barbers } from "@/components/admin/barbers";

// Admin data is read in the browser for now (frontend-only data layer), so
// there is no server-rendered content to validate. Remove once pages load
// their data from Neon on the server.
export const instant = false;

export default function Page() {
  return <Barbers />;
}

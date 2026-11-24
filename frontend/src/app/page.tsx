import { connection } from "next/server";
import { Landing } from "@/components/landing/landing";
import { fetchPublicMenu } from "@/lib/public-menu";

// The customer landing page: public, live data from the API on every request.
export const instant = false;

export default async function Home() {
  await connection();
  return <Landing menu={await fetchPublicMenu()} />;
}

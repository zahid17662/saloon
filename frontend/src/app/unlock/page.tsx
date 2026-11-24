import { connection } from "next/server";
import { UnlockForm } from "@/components/unlock-form";
import { publicShopName } from "@/lib/shop-name";

// Reads the shop name from the API on every request.
export const instant = false;

export default async function Page() {
  await connection();
  return <UnlockForm shopName={await publicShopName()} />;
}

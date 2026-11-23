import { connection } from "next/server";
import { AdminLogin } from "@/components/admin/login";
import { publicShopName } from "@/lib/shop-name";

// Reads the shop name from the database on every request.
export const instant = false;

export default async function Page() {
  await connection();
  return <AdminLogin shopName={await publicShopName()} />;
}

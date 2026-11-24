import { connection } from "next/server";
import { ShopBoard } from "@/components/shop-board";
import { fetchPublicMenu } from "@/lib/public-menu";

export const metadata = { title: "দোকান ড্যাশবোর্ড" };
export const instant = false;

export default async function ShopPage() {
  await connection();
  const menu = await fetchPublicMenu();
  const services = (menu?.services ?? []).map((s) => ({ id: s.id, name: s.name, price: s.price }));
  return <ShopBoard services={services} />;
}

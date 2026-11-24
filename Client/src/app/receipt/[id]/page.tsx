import { db } from "@server/db";
import { ShopGate } from "@/components/gates";
import { ReceiptView } from "@/components/receipt-view";
import { ensureShop } from "@server/lib/page-auth";
import { getSale } from "@server/server/sales";

// Live data from Neon on every request (Cache Components: no prerendered body for this page).
export const instant = false;

export default async function ReceiptPage({ params }: PageProps<"/receipt/[id]">) {
  const { id } = await params;
  const saleId = Number(id);
  await ensureShop();
  const sale = Number.isSafeInteger(saleId) && saleId > 0 ? await getSale(db, saleId) : null;
  return (
    <ShopGate>
      <ReceiptView sale={sale} />
    </ShopGate>
  );
}

import { connection } from "next/server";
import Link from "next/link";
import { BookTabs } from "@/components/landing/book-tabs";
import { Logo } from "@/components/logo";
import { BackIcon } from "@/components/icons";
import { fetchPublicMenu } from "@/lib/public-menu";

export const metadata = { title: "বুক করুন" };

// Live queue and menu data on every request.
export const instant = false;

export default async function BookPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  await connection();
  const [menu, params] = await Promise.all([fetchPublicMenu(), searchParams]);
  if (!menu) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-bold text-fg">পেজটি এখন লোড করা যাচ্ছে না</h1>
        <Link href="/" className="text-sm text-primary hover:underline">হোমে ফিরুন</Link>
      </main>
    );
  }
  const id = Number(params.service);
  const preset = menu.services.some((s) => s.id === id) ? id : undefined;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/" aria-label="হোমে ফিরুন" className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary-soft">
            <BackIcon className="h-5 w-5" />
          </Link>
          <Logo size={34} />
          <span className="font-display truncate text-sm font-semibold tracking-[0.08em] text-fg">
            {menu.shop.name.trim() || "সেলুন"}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-5 text-xl font-bold text-fg">বুক করুন</h1>
        <BookTabs menu={menu} preset={preset} />
      </main>
    </div>
  );
}

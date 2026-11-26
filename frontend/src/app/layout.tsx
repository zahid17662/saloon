import type { Metadata, Viewport } from "next";
import { Noto_Sans_Bengali, Noto_Serif_Bengali, Outfit, Poppins } from "next/font/google";
import { connection } from "next/server";
import { CatalogBoundary } from "@/components/catalog-boundary";
import { fetchShopName } from "@/lib/shop-name";
import "./globals.css";

// Poppins renders Latin letters and numbers; Noto Sans Bengali covers Bangla (clear, open letterforms at small sizes).
// The browser picks per glyph, so mixed text uses both.
const latin = Poppins({
  variable: "--font-latin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Chunky geometric sans for the brand name and big headings only.
const display = Outfit({
  variable: "--font-display-latin",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const bangla = Noto_Sans_Bengali({
  variable: "--font-bn",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700", "800"],
});

// Elegant Bangla serif, used for the home hero headline only.
const banglaSerif = Noto_Serif_Bengali({
  variable: "--font-bn-serif",
  subsets: ["bengali"],
  weight: ["600", "700"],
});

const FALLBACK_TITLE = "সেলুন হিসাব";

// The browser tab shows the shop name from Settings (it is already shown on the public unlock page).
// If the API is unreachable the tab falls back to a generic title rather than failing the page.
export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const title = (await fetchShopName()) ?? FALLBACK_TITLE;
  return { title, description: "সেলুনের সার্ভিস, Hairdresser-এর কমিশন ও দৈনিক হিসাব" };
}

export const viewport: Viewport = {
  themeColor: "#f7f6f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className={`${latin.variable} ${display.variable} ${bangla.variable} ${banglaSerif.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <CatalogBoundary>{children}</CatalogBoundary>
      </body>
    </html>
  );
}

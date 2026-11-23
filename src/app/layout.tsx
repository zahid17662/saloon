import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Poppins } from "next/font/google";
import { CatalogBoundary } from "@/components/catalog-boundary";
import "./globals.css";

// Poppins renders Latin letters and numbers; Hind Siliguri covers Bangla.
// The browser picks per glyph, so mixed text uses both.
const latin = Poppins({
  variable: "--font-latin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bangla = Hind_Siliguri({
  variable: "--font-bn",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "সেলুন হিসাব",
  description: "সেলুনের সার্ভিস, নাপিতের কমিশন ও দৈনিক হিসাব",
};

export const viewport: Viewport = {
  themeColor: "#f3f5f9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className={`${latin.variable} ${bangla.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <CatalogBoundary>{children}</CatalogBoundary>
      </body>
    </html>
  );
}

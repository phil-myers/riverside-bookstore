import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

// Product A isn't always the same URL locally vs. deployed -- same pattern as the other
// cross-product links in this repo (env var with a local-dev fallback, not a secret).
const HOMEPAGE_URL = process.env.NEXT_PUBLIC_PRODUCT_A_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Riverside Books — Staff Inventory",
  description: "Staff inventory and ops dashboard for Riverside Books.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-ink/10 bg-paper">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-4">
            <a href={HOMEPAGE_URL} className="text-sm font-medium text-ink/60 hover:text-ink">
              ← Riverside Books
            </a>
            <span className="inline-flex items-center rounded-full border-2 border-dashed border-gold px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-gold">
              Staff
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

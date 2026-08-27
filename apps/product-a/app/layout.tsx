import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { AuthNav } from "@/components/AuthNav";
import { DrawerProvider } from "@/components/DrawerProvider";
import { CartButton } from "@/components/CartButton";

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

// Product C isn't deployed yet (see docs/DEPLOYMENT.md) -- same pattern as the homepage's Staff
// links, so this works against a local dev server now and gets pointed at a real URL later
// without a code change. NEXT_PUBLIC_ prefix is fine: just a page address, not a secret.
const SUPPORT_CHAT_URL = process.env.NEXT_PUBLIC_PRODUCT_C_URL || "http://localhost:3003";

export const metadata: Metadata = {
  title: "Riverside Books — Ordering & Loyalty",
  description: "Browse titles, order books, and track loyalty rewards at Riverside Books.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <DrawerProvider>
          <header className="border-b border-ink/10 bg-paper">
            <div className="mx-auto flex max-w-2xl items-center justify-between px-8 py-4">
              <Link href="/" className="font-serif text-lg font-semibold text-ink">
                Riverside Books
              </Link>
              <div className="flex items-center gap-4">
                <a href={SUPPORT_CHAT_URL} className="text-sm font-medium text-accent hover:opacity-80">
                  Chat
                </a>
                <CartButton />
                <AuthNav />
              </div>
            </div>
          </header>
          {children}
        </DrawerProvider>
      </body>
    </html>
  );
}

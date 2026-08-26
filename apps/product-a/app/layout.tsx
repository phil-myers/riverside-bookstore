import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AuthNav } from "@/components/AuthNav";

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
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-8 py-4">
            <Link href="/" className="text-lg font-semibold text-neutral-900">
              Riverside Books
            </Link>
            <div className="flex items-center gap-4">
              <a href={SUPPORT_CHAT_URL} className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
                Chat
              </a>
              <Link href="/cart" className="text-sm text-neutral-600 hover:text-neutral-900">
                Cart
              </Link>
              <AuthNav />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

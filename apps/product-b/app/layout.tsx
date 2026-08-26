import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-4">
            <a href={HOMEPAGE_URL} className="text-sm font-medium text-neutral-500 hover:text-neutral-700">
              ← Riverside Books
            </a>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Staff
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

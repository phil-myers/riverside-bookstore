import Link from "next/link";
import { getBooks } from "@/lib/books";
import { FeaturedBookCard } from "@/components/FeaturedBookCard";

// Product B/D aren't deployed yet (see docs/DEPLOYMENT.md) -- these env vars let this link work
// against local dev servers now and get pointed at real URLs later without a code change.
// NEXT_PUBLIC_ prefix is fine here: these are just plain page addresses, not secrets.
const STAFF_INVENTORY_URL = process.env.NEXT_PUBLIC_PRODUCT_B_URL || "http://localhost:3001";
const STAFF_CONTENT_TOOL_URL = process.env.NEXT_PUBLIC_PRODUCT_D_URL || "http://localhost:3002";

export default async function Home() {
  const { books } = await getBooks();
  const featured = books.filter((book) => book.stockQuantity > 0);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <section className="py-8 text-center">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">Riverside Books</h1>
        <p className="mt-3 text-ink/70">
          Your independent neighborhood bookstore — new arrivals, staff picks, and the titles
          you&apos;re looking for.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-paper hover:opacity-90"
        >
          Books
        </Link>
      </section>

      {featured.length > 0 && (
        <section className="mt-4 border-t border-ink/10 pt-8">
          <p className="mb-6 text-sm font-medium text-ink/70">On the shelf right now</p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {featured.map((book) => (
              <FeaturedBookCard key={book.isbn} book={book} size="large" />
            ))}
          </div>
        </section>
      )}

      <footer className="mt-12 border-t border-ink/10 pt-4 text-center">
        <a href={STAFF_INVENTORY_URL} className="text-sm text-ink/60 hover:text-ink">
          Staff
        </a>
        <span className="mx-2 text-sm text-ink/30">·</span>
        <a
          href={STAFF_CONTENT_TOOL_URL}
          className="text-sm text-ink/60 hover:text-ink"
        >
          Content tools
        </a>
      </footer>
    </main>
  );
}

import Link from "next/link";
import { getBooks } from "@/lib/books";
import { CoverPlaceholder } from "@/components/CoverPlaceholder";

// Product B/D aren't deployed yet (see docs/DEPLOYMENT.md) -- these env vars let this link work
// against local dev servers now and get pointed at real URLs later without a code change.
// NEXT_PUBLIC_ prefix is fine here: these are just plain page addresses, not secrets.
const STAFF_INVENTORY_URL = process.env.NEXT_PUBLIC_PRODUCT_B_URL || "http://localhost:3001";
const STAFF_CONTENT_TOOL_URL = process.env.NEXT_PUBLIC_PRODUCT_D_URL || "http://localhost:3002";

export default async function Home() {
  const { books } = await getBooks();
  const featured = books.filter((book) => book.stockQuantity > 0).slice(0, 4);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <section className="py-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Riverside Books</h1>
        <p className="mt-3 text-neutral-600">
          Your independent neighborhood bookstore — new arrivals, staff picks, and the titles
          you&apos;re looking for.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Books
        </Link>
      </section>

      {featured.length > 0 && (
        <section className="mt-4 border-t border-neutral-200 pt-8">
          <p className="mb-4 text-sm font-medium text-neutral-700">On the shelf right now</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {featured.map((book) => (
              <Link
                key={book.isbn}
                href="/shop"
                className="block text-center transition-opacity hover:opacity-80"
              >
                {book.coverImageUrl ? (
                  // Same no-fixed-remote-image-domain reasoning as /shop -- see that page.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.coverImageUrl}
                    alt=""
                    className="mx-auto h-32 w-[88px] rounded-md object-cover shadow-sm"
                  />
                ) : (
                  <CoverPlaceholder
                    title={book.title}
                    isbn={book.isbn}
                    className="mx-auto h-32 w-[88px] rounded-md shadow-sm"
                  />
                )}
                <p className="mt-2 truncate text-xs text-neutral-600">{book.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-12 border-t border-neutral-200 pt-4 text-center">
        <a href={STAFF_INVENTORY_URL} className="text-xs text-neutral-400 hover:text-neutral-600">
          Staff
        </a>
        <span className="mx-2 text-xs text-neutral-300">·</span>
        <a
          href={STAFF_CONTENT_TOOL_URL}
          className="text-xs text-neutral-400 hover:text-neutral-600"
        >
          Content tools
        </a>
      </footer>
    </main>
  );
}

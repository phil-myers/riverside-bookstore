import Link from "next/link";
import { getBooks } from "@/lib/books";

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
        <h1 className="text-3xl font-semibold tracking-tight">Riverside Books</h1>
        <p className="mt-3 text-stone-600">
          Your independent neighborhood bookstore — new arrivals, staff picks, and the titles
          you&apos;re looking for.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800"
        >
          Inventory
        </Link>
      </section>

      {featured.length > 0 && (
        <section className="mt-4 border-t border-stone-200 pt-8">
          <p className="mb-4 text-sm font-medium text-stone-700">On the shelf right now</p>
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
                    className="mx-auto h-32 w-[88px] rounded-sm object-cover shadow-sm"
                  />
                ) : (
                  <div className="mx-auto flex h-32 w-[88px] items-center justify-center rounded-sm bg-stone-100 text-xs text-stone-400">
                    No cover
                  </div>
                )}
                <p className="mt-2 truncate text-xs text-stone-600">{book.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-12 border-t border-stone-100 pt-4 text-center">
        <a href={STAFF_INVENTORY_URL} className="text-xs text-stone-300 hover:text-stone-400">
          Staff
        </a>
        <span className="mx-2 text-xs text-stone-200">·</span>
        <a
          href={STAFF_CONTENT_TOOL_URL}
          className="text-xs text-stone-300 hover:text-stone-400"
        >
          Content tools
        </a>
      </footer>
    </main>
  );
}

import { getBooks } from "@/lib/books";
import { AddToCartButton } from "@/components/AddToCartButton";

export default async function Shop() {
  const { books, source } = await getBooks();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <p className="mb-6 text-sm text-stone-500">Browse what&apos;s on the shelf.</p>

      {source === "sample" && (
        <p className="mb-6 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Showing sample data. Copy <code>.env.example</code> to <code>.env.local</code> and fill
          in a Supabase project&apos;s URL and anon key to see your real catalog.
        </p>
      )}

      {source === "supabase" && books.length === 0 && (
        <p className="text-sm text-stone-500">No books in the catalog yet.</p>
      )}

      {books.length > 0 && (
        <ul className="divide-y divide-stone-200">
          {books.map((book) => (
            <li key={book.isbn} className="flex items-center gap-4 py-3">
              {book.coverImageUrl && (
                // Cover source isn't confirmed yet (docs/google-books-integration-plan.md, live
                // fetching not built), so no fixed remote-image domain to configure next/image
                // against.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverImageUrl}
                  alt=""
                  className="h-16 w-11 flex-shrink-0 rounded-sm object-cover"
                />
              )}
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <p className="font-medium">{book.title}</p>
                  <p className="text-sm text-stone-500">{book.author}</p>
                  <p className="text-sm text-stone-700">${book.price.toFixed(2)}</p>
                  <p className="text-xs text-stone-400">
                    {book.stockQuantity > 0 ? `${book.stockQuantity} in stock` : "Out of stock"}
                  </p>
                </div>
                <AddToCartButton book={book} disabled={book.stockQuantity === 0} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

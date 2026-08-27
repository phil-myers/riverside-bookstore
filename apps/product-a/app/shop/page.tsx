import { getBooks } from "@/lib/books";
import { ShopRow } from "@/components/ShopRow";

export default async function Shop() {
  const { books, source } = await getBooks();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <p className="mb-6 text-sm text-ink/60">Browse what&apos;s on the shelf. Click a title for details.</p>

      {source === "sample" && (
        <p className="mb-6 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-ink/80">
          Showing sample data. Copy <code>.env.example</code> to <code>.env.local</code> and fill
          in a Supabase project&apos;s URL and anon key to see your real catalog.
        </p>
      )}

      {source === "supabase" && books.length === 0 && (
        <p className="text-sm text-ink/60">No books in the catalog yet.</p>
      )}

      {books.length > 0 && (
        <ul className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-surface px-4 shadow-sm">
          {books.map((book) => (
            <ShopRow key={book.isbn} book={book} />
          ))}
        </ul>
      )}
    </main>
  );
}

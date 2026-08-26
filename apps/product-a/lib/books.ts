import { getSupabaseClient } from "./supabase";
import { getBookCoverByIsbn } from "./googleBooks";
import bookCovers from "./bookCovers.json";
import type { Book } from "../types/book";

// Static, one-time-fetched cover data (see SPEC.md / scripts/fetch-book-covers.mjs) -- used as a
// fallback when the live `books` table's cover_image_url is null, which is every row today since
// nothing else populates that column. No live API call, no write to the shared table.
const staticCovers: Record<string, { coverUrl: string | null }> = bookCovers;

export type BooksSource = "supabase" | "sample";

type BooksResult = {
  books: Book[];
  source: BooksSource;
};

// Sample data for local dev / demos before a Supabase project is configured. Titles, authors,
// and stock pulled straight from docs/schema/riverside-books-integration-chaos-test.csv (the
// team's existing synthetic dataset) — not invented. Prices are placeholder demo values (the CSV
// has none) since the shared schema's price column was only just added. Real catalog data comes
// from the "books" table once .env.local points at a real Supabase project (see .env.example and
// supabase/migrations/).
const SAMPLE_BOOKS: Book[] = [
  { isbn: "978-0-525-55948-1", title: "The Midnight Library", author: "Matt Haig", stockQuantity: 42, price: 17.99 },
  { isbn: "978-0-399-59050-4", title: "Educated", author: "Tara Westover", stockQuantity: 18, price: 16.99 },
  { isbn: "978-0-7352-1909-0", title: "Where the Crawdads Sing", author: "Delia Owens", stockQuantity: 7, price: 15.99 },
  { isbn: "978-1-250-30169-7", title: "The Silent Patient", author: "Alex Michaelides", stockQuantity: 0, price: 14.99 },
  { isbn: "978-0-7352-1129-2", title: "Atomic Habits", author: "James Clear", stockQuantity: 95, price: 18.99 },
  { isbn: "978-0-316-55634-7", title: "Circe", author: "Madeline Miller", stockQuantity: 33, price: 16.99 },
  { isbn: "978-0-593-13520-4", title: "Project Hail Mary", author: "Andy Weir", stockQuantity: 55, price: 19.99 },
  {
    isbn: "978-1-668-08178-5",
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    stockQuantity: 4,
    price: 15.99,
  },
];

export async function getBooks(): Promise<BooksResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    // Live cover art for sample data: no-op if GOOGLE_BOOKS_API_KEY isn't set (falls back to no
    // cover, same as before), so this never blocks the sample-data path on a missing key.
    const books = await Promise.all(
      SAMPLE_BOOKS.map(async (book) => {
        const cover = await getBookCoverByIsbn(book.isbn);
        return cover.found ? { ...book, coverImageUrl: cover.coverImageUrl } : book;
      }),
    );
    return { books, source: "sample" };
  }

  const { data, error } = await supabase
    .from("books")
    .select("isbn, title, author, stock_quantity, price, cover_image_url");

  if (error) {
    throw error;
  }

  const books: Book[] = (data ?? []).map((row) => ({
    isbn: row.isbn,
    title: row.title,
    author: row.author,
    stockQuantity: row.stock_quantity,
    // Postgres numeric columns come back from Supabase as strings, not numbers, to avoid float
    // precision loss — coerce explicitly so .toFixed() etc. work on the live-data path too.
    price: Number(row.price),
    coverImageUrl: row.cover_image_url ?? staticCovers[row.isbn]?.coverUrl ?? null,
  }));

  return { books, source: "supabase" };
}

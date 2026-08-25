import { getSupabaseClient } from "./supabase";

export type StockStatus = "out-of-stock" | "low-stock" | "ok";

export type BookStockRow = {
  isbn: string;
  title: string;
  author: string;
  stockQuantity: number;
  reorderThreshold: number;
  status: StockStatus;
};

export type InventorySource = "supabase" | "sample";

export type InventoryResult = {
  books: BookStockRow[];
  source: InventorySource;
};

// Sample data for local dev / demos — also the only mode that currently works end-to-end, since
// reorder_threshold doesn't exist on the live books table yet (see SPEC.md Open Question 1).
// Values chosen to exercise all three status states plus the exact-threshold boundary.
const SAMPLE_BOOKS: Omit<BookStockRow, "status">[] = [
  { isbn: "978-0-525-55948-1", title: "The Midnight Library", author: "Matt Haig", stockQuantity: 42, reorderThreshold: 5 },
  { isbn: "978-0-399-59050-4", title: "Educated", author: "Tara Westover", stockQuantity: 18, reorderThreshold: 4 },
  { isbn: "978-0-7352-1909-0", title: "Where the Crawdads Sing", author: "Delia Owens", stockQuantity: 3, reorderThreshold: 3 },
  { isbn: "978-1-250-30170-7", title: "The Silent Patient", author: "Alex Michaelides", stockQuantity: 0, reorderThreshold: 5 },
  { isbn: "978-0-7352-1129-2", title: "Atomic Habits", author: "James Clear", stockQuantity: 95, reorderThreshold: 10 },
  { isbn: "978-0-316-55635-9", title: "Circe", author: "Madeline Miller", stockQuantity: 2, reorderThreshold: 6 },
];

export function classifyStock(stockQuantity: number, reorderThreshold: number): StockStatus {
  if (stockQuantity <= 0) {
    return "out-of-stock";
  }
  if (stockQuantity <= reorderThreshold) {
    return "low-stock";
  }
  return "ok";
}

const STATUS_URGENCY: Record<StockStatus, number> = {
  "out-of-stock": 0,
  "low-stock": 1,
  ok: 2,
};

function sortByUrgency(rows: BookStockRow[]): BookStockRow[] {
  return [...rows].sort((a, b) => {
    const urgencyDiff = STATUS_URGENCY[a.status] - STATUS_URGENCY[b.status];
    return urgencyDiff !== 0 ? urgencyDiff : a.title.localeCompare(b.title);
  });
}

export async function getInventoryStatus(): Promise<InventoryResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    const rows = SAMPLE_BOOKS.map((book) => ({
      ...book,
      status: classifyStock(book.stockQuantity, book.reorderThreshold),
    }));
    return { books: sortByUrgency(rows), source: "sample" };
  }

  // Column names match apps/product-a/supabase/migrations/0005_google_books_schema.sql, which
  // renamed "ISBN"/book_title/author_name to isbn/title/author. reorder_threshold isn't on the
  // live table yet (SPEC.md Open Question 1) — this query will fail with a clear Postgres
  // "column does not exist" error until that's added, rather than silently defaulting every book
  // to some made-up threshold.
  const { data, error } = await supabase
    .from("books")
    .select("isbn, title, author, stock_quantity, reorder_threshold");

  if (error) {
    throw error;
  }

  const rows: BookStockRow[] = (data ?? []).map((row) => ({
    isbn: row.isbn,
    title: row.title,
    author: row.author,
    stockQuantity: row.stock_quantity,
    reorderThreshold: row.reorder_threshold,
    status: classifyStock(row.stock_quantity, row.reorder_threshold),
  }));

  return { books: sortByUrgency(rows), source: "supabase" };
}

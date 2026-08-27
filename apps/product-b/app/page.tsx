import { getInventoryStatus, type StockStatus } from "@/lib/inventory";
import { CoverPlaceholder } from "@/components/CoverPlaceholder";
import { StampBadge, type StampTone } from "@/components/StampBadge";

const STATUS_LABEL: Record<StockStatus, string> = {
  "out-of-stock": "Out of Stock",
  "low-stock": "Low Stock",
  ok: "GOOD",
};

const STATUS_TONE: Record<StockStatus, StampTone> = {
  "out-of-stock": "negative",
  "low-stock": "pending",
  ok: "positive",
};

const STAT_TILES: { status: StockStatus; label: string; accent: string; bar: string }[] = [
  { status: "out-of-stock", label: "Out of Stock", accent: "text-claret", bar: "bg-claret" },
  { status: "low-stock", label: "Low Stock", accent: "text-gold", bar: "bg-gold" },
  { status: "ok", label: "Good", accent: "text-accent", bar: "bg-accent" },
];

export default async function Home() {
  const { books, source } = await getInventoryStatus();

  // Plain counting, not a model call -- matches the repo's Bounded AI rule.
  const counts: Record<StockStatus, number> = {
    "out-of-stock": books.filter((b) => b.status === "out-of-stock").length,
    "low-stock": books.filter((b) => b.status === "low-stock").length,
    ok: books.filter((b) => b.status === "ok").length,
  };
  const total = books.length || 1;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-1 font-serif text-2xl font-semibold text-ink">Inventory Status</h1>
      <p className="mb-6 text-sm text-ink/60">
        Titles needing attention are listed first.
      </p>

      {source === "sample" && (
        <p className="mb-6 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-ink/80">
          Showing sample data. Live data isn&apos;t available yet — the shared{" "}
          <code>books</code> table doesn&apos;t have a <code>reorder_threshold</code> column yet
          (see <code>SPEC.md</code>).
        </p>
      )}

      {books.length > 0 && (
        <>
          <div className="mb-3 grid grid-cols-3 gap-4">
            {STAT_TILES.map((tile) => (
              <div
                key={tile.status}
                className="rounded-2xl border border-ink/10 bg-surface p-5 shadow-sm"
              >
                <p className={`font-mono text-3xl font-semibold ${tile.accent}`}>
                  {counts[tile.status]}
                </p>
                <p className="mt-1 text-sm font-medium text-ink/60">{tile.label}</p>
              </div>
            ))}
          </div>

          {/* Proportion bar -- plain arithmetic on data already in hand, not a charting library. */}
          <div className="mb-6 flex h-2 overflow-hidden rounded-full bg-ink/10">
            {STAT_TILES.map((tile) => {
              const pct = (counts[tile.status] / total) * 100;
              return pct > 0 ? (
                <div key={tile.status} className={tile.bar} style={{ width: `${pct}%` }} />
              ) : null;
            })}
          </div>
        </>
      )}

      {source === "supabase" && books.length === 0 && (
        <p className="text-sm text-ink/60">No books in the catalog yet.</p>
      )}

      {books.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-surface shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">Book inventory, most urgent first</caption>
            <thead>
              <tr className="border-b border-ink/10 bg-paper">
                <th scope="col" className="py-3 pl-5 pr-4 font-medium text-ink/50">
                  <span className="sr-only">Cover</span>
                </th>
                <th scope="col" className="py-3 pr-4 font-serif font-medium text-ink/50">
                  Title
                </th>
                <th scope="col" className="py-3 pr-4 font-medium text-ink/50">
                  Author
                </th>
                <th scope="col" className="py-3 pr-4 font-mono font-medium text-ink/50">
                  Stock
                </th>
                <th scope="col" className="py-3 pr-4 font-mono font-medium text-ink/50">
                  Reorder At
                </th>
                <th scope="col" className="py-3 pr-5 font-medium text-ink/50">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr
                  key={book.isbn}
                  className="border-b border-ink/5 last:border-0 hover:bg-paper"
                >
                  <td className="py-3 pl-5 pr-4">
                    {book.coverUrl ? (
                      // Same reasoning as Product A's catalog: no confirmed remote-image domain
                      // to allowlist for next/image yet, so a plain <img> for now.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.coverUrl}
                        alt=""
                        className="h-14 w-10 rounded-md object-cover shadow-sm"
                      />
                    ) : (
                      <CoverPlaceholder
                        title={book.title}
                        isbn={book.isbn}
                        className="h-14 w-10 rounded-md"
                      />
                    )}
                  </td>
                  <td className="py-3 pr-4 font-serif font-medium text-ink">{book.title}</td>
                  <td className="py-3 pr-4 text-ink/60">{book.author}</td>
                  <td className="py-3 pr-4 font-mono text-ink/80">{book.stockQuantity}</td>
                  <td className="py-3 pr-4 font-mono text-ink/80">{book.reorderThreshold}</td>
                  <td className="py-3 pr-5">
                    <StampBadge tone={STATUS_TONE[book.status]}>
                      {STATUS_LABEL[book.status]}
                    </StampBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

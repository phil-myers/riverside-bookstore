import { getInventoryStatus, type StockStatus } from "@/lib/inventory";
import { CoverPlaceholder } from "@/components/CoverPlaceholder";

const STATUS_LABEL: Record<StockStatus, string> = {
  "out-of-stock": "Out of Stock",
  "low-stock": "Low Stock",
  ok: "OK",
};

const STATUS_BADGE_STYLE: Record<StockStatus, string> = {
  "out-of-stock": "bg-red-100 text-red-700",
  "low-stock": "bg-amber-100 text-amber-700",
  ok: "bg-emerald-100 text-emerald-700",
};

const STAT_TILES: { status: StockStatus; label: string; accent: string }[] = [
  { status: "out-of-stock", label: "Out of Stock", accent: "text-red-600" },
  { status: "low-stock", label: "Low Stock", accent: "text-amber-600" },
  { status: "ok", label: "OK", accent: "text-emerald-600" },
];

export default async function Home() {
  const { books, source } = await getInventoryStatus();

  // Plain counting, not a model call -- matches the repo's Bounded AI rule.
  const counts: Record<StockStatus, number> = {
    "out-of-stock": books.filter((b) => b.status === "out-of-stock").length,
    "low-stock": books.filter((b) => b.status === "low-stock").length,
    ok: books.filter((b) => b.status === "ok").length,
  };

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Inventory Status</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Titles needing attention are listed first.
      </p>

      {source === "sample" && (
        <p className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Showing sample data. Live data isn&apos;t available yet — the shared{" "}
          <code>books</code> table doesn&apos;t have a <code>reorder_threshold</code> column yet
          (see <code>SPEC.md</code>).
        </p>
      )}

      {books.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          {STAT_TILES.map((tile) => (
            <div
              key={tile.status}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <p className={`text-3xl font-semibold ${tile.accent}`}>{counts[tile.status]}</p>
              <p className="mt-1 text-sm font-medium text-neutral-500">{tile.label}</p>
            </div>
          ))}
        </div>
      )}

      {source === "supabase" && books.length === 0 && (
        <p className="text-sm text-neutral-500">No books in the catalog yet.</p>
      )}

      {books.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">Book inventory, most urgent first</caption>
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th scope="col" className="py-3 pl-5 pr-4 font-medium text-neutral-500">
                  <span className="sr-only">Cover</span>
                </th>
                <th scope="col" className="py-3 pr-4 font-medium text-neutral-500">
                  Title
                </th>
                <th scope="col" className="py-3 pr-4 font-medium text-neutral-500">
                  Author
                </th>
                <th scope="col" className="py-3 pr-4 font-medium text-neutral-500">
                  Stock
                </th>
                <th scope="col" className="py-3 pr-4 font-medium text-neutral-500">
                  Reorder At
                </th>
                <th scope="col" className="py-3 pr-5 font-medium text-neutral-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr
                  key={book.isbn}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
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
                  <td className="py-3 pr-4 font-medium text-neutral-900">{book.title}</td>
                  <td className="py-3 pr-4 text-neutral-500">{book.author}</td>
                  <td className="py-3 pr-4 text-neutral-700">{book.stockQuantity}</td>
                  <td className="py-3 pr-4 text-neutral-700">{book.reorderThreshold}</td>
                  <td className="py-3 pr-5">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_STYLE[book.status]}`}
                    >
                      {STATUS_LABEL[book.status]}
                    </span>
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

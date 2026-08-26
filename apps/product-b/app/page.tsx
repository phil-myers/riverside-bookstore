import { getInventoryStatus, type StockStatus } from "@/lib/inventory";

const STATUS_LABEL: Record<StockStatus, string> = {
  "out-of-stock": "Out of Stock",
  "low-stock": "Low Stock",
  ok: "OK",
};

const STATUS_STYLE: Record<StockStatus, string> = {
  "out-of-stock": "border-red-300 bg-red-100 text-red-800",
  "low-stock": "border-amber-300 bg-amber-100 text-amber-800",
  ok: "border-green-300 bg-green-100 text-green-800",
};

export default async function Home() {
  const { books, source } = await getInventoryStatus();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-2 text-xl font-semibold">Inventory Status</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Titles needing attention are listed first.
      </p>

      {source === "sample" && (
        <p className="mb-6 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Showing sample data. Live data isn&apos;t available yet — the shared{" "}
          <code>books</code> table doesn&apos;t have a <code>reorder_threshold</code> column yet
          (see <code>SPEC.md</code>).
        </p>
      )}

      {source === "supabase" && books.length === 0 && (
        <p className="text-sm text-neutral-500">No books in the catalog yet.</p>
      )}

      {books.length > 0 && (
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Book inventory, most urgent first</caption>
          <thead>
            <tr className="border-b border-neutral-300">
              <th scope="col" className="py-2 pr-4 font-medium">
                <span className="sr-only">Cover</span>
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Title
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Author
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Stock
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Reorder At
              </th>
              <th scope="col" className="py-2 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.isbn} className="border-b border-neutral-100">
                <td className="py-2 pr-4">
                  {book.coverUrl ? (
                    // Same reasoning as Product A's catalog: no confirmed remote-image domain to
                    // allowlist for next/image yet, so a plain <img> for now.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.coverUrl}
                      alt=""
                      className="h-14 w-10 rounded-sm object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-14 w-10 items-center justify-center rounded-sm bg-neutral-100 text-[9px] text-neutral-400">
                      No cover
                    </div>
                  )}
                </td>
                <td className="py-2 pr-4">{book.title}</td>
                <td className="py-2 pr-4 text-neutral-500">{book.author}</td>
                <td className="py-2 pr-4">{book.stockQuantity}</td>
                <td className="py-2 pr-4">{book.reorderThreshold}</td>
                <td className="py-2">
                  <span
                    className={`rounded border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[book.status]}`}
                  >
                    {STATUS_LABEL[book.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

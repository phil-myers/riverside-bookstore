"use client";

import type { Book } from "@/types/book";
import { addToCart } from "@/lib/cart";
import { CoverPlaceholder } from "./CoverPlaceholder";
import { StampBadge } from "./StampBadge";

export function BookDrawer({ book, onClose }: { book: Book | null; onClose: () => void }) {
  const open = book !== null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-ink/30 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={book ? `${book.title} details` : "Book details"}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-paper p-6 shadow-xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="self-end text-sm text-ink/50 hover:text-ink"
        >
          Close ✕
        </button>

        {book && (
          <div className="mt-4 flex flex-1 flex-col">
            {book.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.coverImageUrl}
                alt=""
                className="mx-auto h-56 w-40 rounded-md object-cover shadow-md"
              />
            ) : (
              <CoverPlaceholder
                title={book.title}
                isbn={book.isbn}
                className="mx-auto h-56 w-40 rounded-md shadow-md"
              />
            )}

            <h2 className="mt-6 font-serif text-2xl font-semibold text-ink">{book.title}</h2>
            <p className="mt-1 text-sm text-ink/60">{book.author}</p>
            <p className="mt-3 font-mono text-lg font-semibold text-ink">
              ${book.price.toFixed(2)}
            </p>

            <div className="mt-3">
              <StampBadge tone={book.stockQuantity > 0 ? "positive" : "negative"}>
                {book.stockQuantity > 0 ? "In Stock" : "Out of Stock"}
              </StampBadge>
            </div>

            <button
              type="button"
              disabled={book.stockQuantity === 0}
              onClick={() => addToCart(book)}
              className="mt-auto rounded-full bg-accent px-4 py-3 text-sm font-semibold text-paper hover:opacity-90 disabled:cursor-not-allowed disabled:bg-ink/20"
            >
              {book.stockQuantity === 0 ? "Out of stock" : "Add to cart"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

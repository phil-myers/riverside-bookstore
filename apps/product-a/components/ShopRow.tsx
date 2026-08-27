"use client";

import type { Book } from "@/types/book";
import { AddToCartButton } from "./AddToCartButton";
import { CoverPlaceholder } from "./CoverPlaceholder";
import { useDrawers } from "./DrawerProvider";

export function ShopRow({ book }: { book: Book }) {
  const { openBook } = useDrawers();

  return (
    <li
      onClick={() => openBook(book)}
      className="flex cursor-pointer items-center gap-4 py-3 hover:bg-paper"
    >
      {book.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.coverImageUrl}
          alt=""
          className="h-16 w-11 flex-shrink-0 rounded-md object-cover"
        />
      ) : (
        <CoverPlaceholder
          title={book.title}
          isbn={book.isbn}
          className="h-16 w-11 flex-shrink-0 rounded-md"
        />
      )}
      <div className="flex flex-1 items-center justify-between">
        <div>
          <p className="font-serif font-medium text-ink">{book.title}</p>
          <p className="text-sm text-ink/60">{book.author}</p>
          <p className="font-mono text-sm text-ink/80">${book.price.toFixed(2)}</p>
          <p className="text-xs text-ink/40">
            {book.stockQuantity > 0 ? `${book.stockQuantity} in stock` : "Out of stock"}
          </p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <AddToCartButton book={book} disabled={book.stockQuantity === 0} />
        </div>
      </div>
    </li>
  );
}

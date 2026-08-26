"use client";

import type { Book } from "@/types/book";
import { CoverPlaceholder } from "./CoverPlaceholder";
import { useDrawers } from "./DrawerProvider";

export function FeaturedBookCard({ book, size = "small" }: { book: Book; size?: "small" | "large" }) {
  const { openBook } = useDrawers();
  const coverClass =
    size === "large"
      ? "mx-auto h-64 w-44 rounded-md shadow-md"
      : "mx-auto h-32 w-[88px] rounded-md shadow-sm";

  return (
    <button
      type="button"
      onClick={() => openBook(book)}
      className="block text-center transition-opacity hover:opacity-80"
    >
      {book.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.coverImageUrl} alt="" className={`${coverClass} object-cover`} />
      ) : (
        <CoverPlaceholder title={book.title} isbn={book.isbn} className={coverClass} />
      )}
      <p
        className={`mt-3 truncate font-serif font-medium text-ink ${size === "large" ? "text-base" : "text-xs"}`}
      >
        {book.title}
      </p>
      {size === "large" && (
        <>
          <p className="truncate text-sm text-ink/60">{book.author}</p>
          <p className="mt-1 font-mono text-sm text-ink/80">${book.price.toFixed(2)}</p>
        </>
      )}
    </button>
  );
}

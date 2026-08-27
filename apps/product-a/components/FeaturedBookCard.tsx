"use client";

import type { Book } from "@/types/book";
import { CoverPlaceholder } from "./CoverPlaceholder";
import { useDrawers } from "./DrawerProvider";

export function FeaturedBookCard({ book, size = "small" }: { book: Book; size?: "small" | "large" }) {
  const { openBook } = useDrawers();

  if (size === "small") {
    return (
      <button
        type="button"
        onClick={() => openBook(book)}
        className="block text-center transition-opacity hover:opacity-80"
      >
        {book.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImageUrl}
            alt=""
            className="mx-auto h-32 w-[88px] rounded-md object-cover shadow-sm"
          />
        ) : (
          <CoverPlaceholder
            title={book.title}
            isbn={book.isbn}
            className="mx-auto h-32 w-[88px] rounded-md shadow-sm"
          />
        )}
        <p className="mt-2 truncate text-xs text-ink">{book.title}</p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openBook(book)}
      className="flex flex-col items-center rounded-2xl border border-ink/10 bg-surface p-5 text-center shadow-sm transition-shadow hover:shadow-md"
    >
      {book.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.coverImageUrl}
          alt=""
          className="h-48 w-32 rounded-md object-cover shadow-md"
        />
      ) : (
        <CoverPlaceholder
          title={book.title}
          isbn={book.isbn}
          className="h-48 w-32 rounded-md shadow-md"
        />
      )}
      <p className="mt-4 line-clamp-2 font-serif text-sm font-semibold text-ink">{book.title}</p>
      <p className="mt-1 truncate text-xs text-ink/60">{book.author}</p>
      <p className="mt-2 font-mono text-sm text-ink/80">${book.price.toFixed(2)}</p>
    </button>
  );
}

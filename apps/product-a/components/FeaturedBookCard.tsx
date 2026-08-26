"use client";

import type { Book } from "@/types/book";
import { CoverPlaceholder } from "./CoverPlaceholder";
import { useDrawers } from "./DrawerProvider";

export function FeaturedBookCard({ book }: { book: Book }) {
  const { openBook } = useDrawers();

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
      <p className="mt-2 truncate text-xs text-ink/60">{book.title}</p>
    </button>
  );
}

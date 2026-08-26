"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";
import type { Book } from "@/types/book";

type Props = {
  book: Pick<Book, "isbn" | "title" | "author" | "price">;
  disabled?: boolean;
};

export function AddToCartButton({ book, disabled }: Props) {
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        addToCart(book);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-paper hover:opacity-90 disabled:cursor-not-allowed disabled:bg-ink/20"
    >
      {disabled ? "Out of stock" : added ? "Added" : "Add to cart"}
    </button>
  );
}

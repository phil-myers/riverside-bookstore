"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";
import type { Book } from "@/types/book";
import { useDrawers } from "./DrawerProvider";

type Props = {
  book: Pick<Book, "isbn" | "title" | "author" | "price">;
  disabled?: boolean;
  size?: "sm" | "lg";
};

const RESET_LABEL_DELAY_MS = 1500;
// Gives the "Added" label a moment to register before the cart drawer takes over the screen.
const OPEN_CART_DELAY_MS = 700;

const SIZE_CLASSES: Record<"sm" | "lg", string> = {
  sm: "px-3 py-1 text-xs",
  lg: "mt-auto px-4 py-3 text-sm",
};

export function AddToCartButton({ book, disabled, size = "sm" }: Props) {
  const [added, setAdded] = useState(false);
  const { showToast, openCart } = useDrawers();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        addToCart(book);
        setAdded(true);
        showToast(`Added “${book.title}” to cart`);
        setTimeout(() => setAdded(false), RESET_LABEL_DELAY_MS);
        setTimeout(() => openCart(), OPEN_CART_DELAY_MS);
      }}
      className={`rounded-full bg-accent font-semibold text-paper hover:opacity-90 disabled:cursor-not-allowed disabled:bg-ink/20 ${SIZE_CLASSES[size]}`}
    >
      {disabled ? "Out of stock" : added ? "Added" : "Add to cart"}
    </button>
  );
}

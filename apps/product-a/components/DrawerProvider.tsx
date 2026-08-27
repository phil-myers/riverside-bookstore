"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import type { Book } from "@/types/book";
import { CartDrawer } from "./CartDrawer";
import { BookDrawer } from "./BookDrawer";
import { CartToast } from "./CartToast";

type DrawerContextValue = {
  openBook: (book: Book) => void;
  openCart: () => void;
  close: () => void;
  showToast: (message: string) => void;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

const TOAST_DURATION_MS = 2500;

// Additive quick-view panels (matches Jeffrey's cart-drawer.tsx / product-drawer.tsx pattern) --
// deliberately doesn't replace the existing /cart page's tested checkout flow, just gives faster
// access to it. One provider mounted once in the root layout, rather than per-page state, since
// the header's Cart button and every book row across pages all need to open the same drawers.
export function DrawerProvider({ children }: { children: ReactNode }) {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openBook(book: Book) {
    setCartOpen(false);
    setSelectedBook(book);
  }

  function openCart() {
    setSelectedBook(null);
    setCartOpen(true);
  }

  function close() {
    setSelectedBook(null);
    setCartOpen(false);
  }

  function showToast(message: string) {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  }

  return (
    <DrawerContext.Provider value={{ openBook, openCart, close, showToast }}>
      {children}
      <BookDrawer book={selectedBook} onClose={close} />
      <CartDrawer open={cartOpen} onClose={close} />
      <CartToast message={toastMessage} />
    </DrawerContext.Provider>
  );
}

export function useDrawers(): DrawerContextValue {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error("useDrawers must be used within a DrawerProvider");
  }
  return ctx;
}

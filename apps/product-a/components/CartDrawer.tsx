"use client";

import Link from "next/link";
import { removeFromCart, setQuantity, useCartItems } from "@/lib/cart";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useCartItems();
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
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
        aria-label="Cart"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-paper p-6 shadow-xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-ink">Your cart</h2>
          <button type="button" onClick={onClose} className="text-sm text-ink/50 hover:text-ink">
            Close ✕
          </button>
        </div>

        {items.length === 0 ? (
          <p className="mt-6 text-sm text-ink/60">Nothing here yet.</p>
        ) : (
          <ul className="mt-4 flex-1 divide-y divide-ink/10 overflow-y-auto">
            {items.map((item) => (
              <li key={item.isbn} className="py-3">
                <p className="font-serif font-medium text-ink">{item.title}</p>
                <p className="text-xs text-ink/50">{item.author}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label htmlFor={`drawer-qty-${item.isbn}`} className="sr-only">
                      Quantity for {item.title}
                    </label>
                    <input
                      id={`drawer-qty-${item.isbn}`}
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => setQuantity(item.isbn, Number(e.target.value))}
                      className="w-14 rounded-md border border-ink/20 bg-field px-2 py-1 text-sm text-ink"
                    />
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.isbn)}
                      className="text-xs text-claret underline"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="font-mono text-sm text-ink">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <div className="mt-4 border-t border-ink/10 pt-4">
            <p className="mb-3 flex justify-between font-mono text-sm font-semibold text-ink">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </p>
            <Link
              href="/cart"
              onClick={onClose}
              className="block rounded-full bg-accent px-4 py-3 text-center text-sm font-semibold text-paper hover:opacity-90"
            >
              View cart & checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearCart, removeFromCart, setQuantity, useCartItems } from "@/lib/cart";
import { AUTH_CHANGED_EVENT, getCurrentCustomerId } from "@/lib/auth";
import { placeOrder } from "@/lib/orders";

export default function CartPage() {
  const items = useCartItems();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placedOrderTotal, setPlacedOrderTotal] = useState<number | null>(null);

  useEffect(() => {
    getCurrentCustomerId().then(setCustomerId);

    // Logging out/in via the nav while already sitting on /cart doesn't remount this page, so
    // without this, the "Place order" button vs. "Log in to place an order" gate would go stale.
    function handleAuthChanged() {
      getCurrentCustomerId().then(setCustomerId);
    }
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
  }, []);

  async function handlePlaceOrder() {
    if (!customerId) {
      return;
    }
    setPlacing(true);
    setOrderError(null);

    const result = await placeOrder(items);
    setPlacing(false);

    if (result.error) {
      setOrderError(result.error);
      return;
    }

    setPlacedOrderTotal(totalPrice);
    clearCart();
    setPlacedOrderId(result.orderId);
  }

  if (placedOrderId) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-2xl font-semibold">Order placed</h1>
        <p className="mt-2 text-sm text-stone-500">
          Order <span className="font-mono">{placedOrderId}</span> is pending
          {placedOrderTotal !== null && <> — ${placedOrderTotal.toFixed(2)}</>}.
        </p>
        <Link href="/shop" className="mt-6 inline-block text-sm underline">
          Back to the catalog
        </Link>
      </main>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">Your cart</h1>
      <p className="mb-6 text-sm text-stone-500">
        {totalItems === 0 ? "Nothing here yet." : `${totalItems} item${totalItems === 1 ? "" : "s"}`}
      </p>

      {items.length === 0 ? (
        <Link href="/shop" className="text-sm underline">
          Browse the catalog
        </Link>
      ) : (
        <>
          <ul className="divide-y divide-stone-200">
            {items.map((item) => (
              <li key={item.isbn} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-stone-500">{item.author}</p>
                  <p className="text-sm text-stone-700">
                    ${item.price.toFixed(2)} × {item.quantity} = $
                    {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor={`quantity-${item.isbn}`} className="sr-only">
                    Quantity for {item.title}
                  </label>
                  <input
                    id={`quantity-${item.isbn}`}
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(event) => setQuantity(item.isbn, Number(event.target.value))}
                    className="w-14 rounded border border-stone-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.isbn)}
                    className="text-xs text-red-600 underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-right text-sm font-medium">Total: ${totalPrice.toFixed(2)}</p>

          {orderError && <p className="mt-4 text-sm text-red-600">{orderError}</p>}

          {customerId ? (
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing}
              className="mt-4 rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:bg-stone-300"
            >
              {placing ? "Placing order…" : "Place order"}
            </button>
          ) : (
            <p className="mt-4 text-sm text-stone-500">
              <Link href="/login" className="underline">
                Log in
              </Link>{" "}
              to place an order.
            </p>
          )}
        </>
      )}
    </main>
  );
}

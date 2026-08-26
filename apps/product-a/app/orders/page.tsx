"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentCustomerId } from "@/lib/auth";
import { getOrderHistory } from "@/lib/orders";
import type { Order } from "@/types/order";

export default function OrdersPage() {
  const [customerId, setCustomerId] = useState<string | null | "loading">("loading");
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentCustomerId().then((id) => {
      setCustomerId(id);
      if (!id) {
        return;
      }
      getOrderHistory(id).then((result) => {
        setOrders(result.orders);
        setError(result.error);
      });
    });
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">Your orders</h1>

      {customerId === "loading" && null}

      {customerId === null && (
        <p className="mt-4 text-sm text-stone-500">
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          to see your order history.
        </p>
      )}

      {customerId && error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {customerId && !error && orders.length === 0 && (
        <p className="mt-4 text-sm text-stone-500">
          No orders yet.{" "}
          <Link href="/shop" className="underline">
            Browse the catalog
          </Link>
          .
        </p>
      )}

      {orders.map((order) => {
        const orderTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return (
          <div key={order.orderId} className="mt-6 rounded border border-stone-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-sm">{order.orderId}</span>
              <span className="text-xs uppercase text-stone-500">{order.status}</span>
            </div>
            <ul className="divide-y divide-stone-200">
              {order.items.map((item) => (
                <li key={item.isbn} className="flex justify-between py-2 text-sm">
                  <span>
                    {item.title} × {item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-right text-sm font-medium">Total: ${orderTotal.toFixed(2)}</p>
          </div>
        );
      })}
    </main>
  );
}

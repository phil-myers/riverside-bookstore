"use client";

import { useCartItems } from "@/lib/cart";
import { useDrawers } from "./DrawerProvider";

export function CartButton() {
  const items = useCartItems();
  const { openCart } = useDrawers();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      type="button"
      onClick={openCart}
      className="text-sm text-ink/70 hover:text-ink"
    >
      Cart{count > 0 ? ` (${count})` : ""}
    </button>
  );
}

import { getSupabaseClient } from "./supabase";
import type { CartItem } from "./cart";
import type { Order } from "@/types/order";

type PlaceOrderResult = { orderId: string; error: null } | { orderId: null; error: string };
type OrderHistoryResult = { orders: Order[]; error: string | null };

export async function placeOrder(items: CartItem[]): Promise<PlaceOrderResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { orderId: null, error: "Supabase isn't configured yet." };
  }

  const { data, error } = await supabase.rpc("place_order", {
    p_items: items.map((item) => ({ isbn: item.isbn, quantity: item.quantity })),
  });

  if (error) {
    return { orderId: null, error: error.message };
  }

  return { orderId: data as string, error: null };
}

export async function getOrderHistory(customerId: string): Promise<OrderHistoryResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { orders: [], error: "Supabase isn't configured yet." };
  }

  const { data, error } = await supabase
    .from("orders")
    .select("order_id, order_status, order_items(quantity, isbn, books(title, author, price))")
    .eq("customer_id", customerId)
    .order("order_id", { ascending: false });

  if (error) {
    return { orders: [], error: error.message };
  }

  const orders: Order[] = (data ?? []).map((row) => ({
    orderId: row.order_id,
    status: row.order_status,
    items: (row.order_items ?? []).map((item) => {
      // Supabase infers embedded relations as arrays without an explicit Database type; this
      // FK (order_items.isbn -> books.isbn) is actually one book per row, so take the first.
      const book = item.books?.[0];
      return {
        isbn: item.isbn,
        title: book?.title ?? "Unknown title",
        author: book?.author ?? "Unknown author",
        price: Number(book?.price ?? 0),
        quantity: item.quantity,
      };
    }),
  }));

  return { orders, error: null };
}

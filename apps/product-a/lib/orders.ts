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
      // order_items.isbn -> books.isbn is many-to-one, so PostgREST embeds it as a single
      // object, not an array (confirmed against the live REST response) — the query builder's
      // structural inference guesses an array here since there's no generated Database type.
      const book = item.books as unknown as {
        title: string;
        author: string;
        price: number;
      } | null;
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

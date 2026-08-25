import { describe, expect, it, vi } from "vitest";
import { placeOrder } from "./orders";
import { getSupabaseClient } from "./supabase";
import type { CartItem } from "./cart";

vi.mock("./supabase", () => ({ getSupabaseClient: vi.fn() }));

const item: CartItem = { isbn: "978-0-525-55948-1", title: "The Midnight Library", author: "Matt Haig", price: 17.99, quantity: 1 };

describe("placeOrder", () => {
  it("sends only p_items to the RPC — never a client-supplied customer id", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "ord_01000", error: null });
    vi.mocked(getSupabaseClient).mockReturnValue({ rpc } as never);

    const result = await placeOrder([item]);

    expect(rpc).toHaveBeenCalledWith("place_order", { p_items: [{ isbn: item.isbn, quantity: item.quantity }] });
    expect(rpc.mock.calls[0][1]).not.toHaveProperty("p_customer_id");
    expect(result).toEqual({ orderId: "ord_01000", error: null });
  });

  it("surfaces the RPC's error message when the order is rejected", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "Not enough stock" } });
    vi.mocked(getSupabaseClient).mockReturnValue({ rpc } as never);

    const result = await placeOrder([item]);

    expect(result).toEqual({ orderId: null, error: "Not enough stock" });
  });

  it("returns a configuration error when Supabase isn't configured", async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(null);

    const result = await placeOrder([item]);

    expect(result).toEqual({ orderId: null, error: "Supabase isn't configured yet." });
  });
});

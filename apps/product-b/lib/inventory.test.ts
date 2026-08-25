import { describe, expect, it, vi } from "vitest";
import { classifyStock, getInventoryStatus } from "./inventory";

vi.mock("./supabase", () => ({ getSupabaseClient: vi.fn(() => null) }));

describe("classifyStock", () => {
  it("returns out-of-stock when stock is zero", () => {
    expect(classifyStock(0, 5)).toBe("out-of-stock");
  });

  it("returns out-of-stock when stock is negative (defensive)", () => {
    expect(classifyStock(-1, 5)).toBe("out-of-stock");
  });

  it("returns low-stock when stock is above zero but at or below threshold", () => {
    expect(classifyStock(3, 5)).toBe("low-stock");
  });

  it("returns low-stock at the exact threshold boundary", () => {
    expect(classifyStock(5, 5)).toBe("low-stock");
  });

  it("returns ok when stock is above threshold", () => {
    expect(classifyStock(6, 5)).toBe("ok");
  });
});

describe("getInventoryStatus (sample-data path)", () => {
  it("falls back to sample data when Supabase isn't configured", async () => {
    const result = await getInventoryStatus();
    expect(result.source).toBe("sample");
    expect(result.books.length).toBeGreaterThan(0);
  });

  it("sorts out-of-stock and low-stock books before ok books", async () => {
    const result = await getInventoryStatus();
    const statuses = result.books.map((b) => b.status);
    const firstOkIndex = statuses.indexOf("ok");
    expect(firstOkIndex).toBeGreaterThan(-1);
    expect(statuses.slice(0, firstOkIndex).every((s) => s !== "ok")).toBe(true);
  });

  it("every returned row's status matches its own stock/threshold", async () => {
    const result = await getInventoryStatus();
    for (const book of result.books) {
      expect(book.status).toBe(classifyStock(book.stockQuantity, book.reorderThreshold));
    }
  });
});

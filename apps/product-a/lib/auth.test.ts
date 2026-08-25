import { describe, expect, it, vi } from "vitest";
import { AUTH_CHANGED_EVENT, getCurrentCustomer, signIn, signOut } from "./auth";
import { getSupabaseClient } from "./supabase";

vi.mock("./supabase", () => ({ getSupabaseClient: vi.fn() }));

function waitForEvent(): Promise<void> {
  return new Promise((resolve) => {
    window.addEventListener(AUTH_CHANGED_EVENT, () => resolve(), { once: true });
  });
}

describe("signIn", () => {
  it("dispatches AUTH_CHANGED_EVENT after a successful sign-in", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "cust_01000", error: null });
    vi.mocked(getSupabaseClient).mockReturnValue({
      auth: { signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }) },
      rpc,
    } as never);

    const fired = waitForEvent();
    await signIn("a@b.com", "pw");
    await fired;

    expect(rpc).toHaveBeenCalledWith("create_customer_row");
  });

  it("does not dispatch AUTH_CHANGED_EVENT when sign-in fails", async () => {
    vi.mocked(getSupabaseClient).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: "Invalid credentials" } }),
      },
    } as never);

    const handler = vi.fn();
    window.addEventListener(AUTH_CHANGED_EVENT, handler);
    const result = await signIn("a@b.com", "wrong");
    window.removeEventListener(AUTH_CHANGED_EVENT, handler);

    expect(result).toEqual({ error: "Invalid credentials" });
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("signOut", () => {
  it("dispatches AUTH_CHANGED_EVENT after signing out", async () => {
    vi.mocked(getSupabaseClient).mockReturnValue({
      auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
    } as never);

    const fired = waitForEvent();
    await signOut();
    await fired;
  });
});

describe("getCurrentCustomer", () => {
  it("maps reward_points through to rewardPoints", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { customer_id: "cust_01000", signup_date: "2026-01-01", reward_points: 42 },
    });
    vi.mocked(getSupabaseClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "u1", email: "a@b.com" } } } }),
      },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
    } as never);

    const customer = await getCurrentCustomer();

    expect(customer).toEqual({
      customerId: "cust_01000",
      email: "a@b.com",
      signupDate: "2026-01-01",
      rewardPoints: 42,
    });
  });

  it("returns null when there's no active session", async () => {
    vi.mocked(getSupabaseClient).mockReturnValue({
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    } as never);

    expect(await getCurrentCustomer()).toBeNull();
  });
});

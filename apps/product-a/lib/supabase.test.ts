import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn(() => ({ marker: "fake-client" }));
vi.mock("@supabase/supabase-js", () => ({ createClient: createClientMock }));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  createClientMock.mockClear();
  process.env = { ...ORIGINAL_ENV };
});

describe("getSupabaseClient", () => {
  it("reuses the same client across repeated calls instead of creating a new one each time", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    const { getSupabaseClient } = await import("./supabase");

    const first = getSupabaseClient();
    const second = getSupabaseClient();

    expect(first).toBe(second);
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });

  it("returns null without caching anything when env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { getSupabaseClient } = await import("./supabase");

    expect(getSupabaseClient()).toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
  });
});

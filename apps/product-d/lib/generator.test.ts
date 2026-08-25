import { describe, it, expect } from "vitest";
import { generateContent } from "./generator";

// generateContent() is now a pure function — no ISBN, no fetchBookMetadata import,
// no async. These tests no longer need to mock anything at the module boundary.

// Catches undefined/null/NaN/[object Object] leaking into user-facing text.
const GARBAGE_PATTERN = /undefined|null|\[object Object\]|NaN/i;

describe("generateContent — required title", () => {
  it("completely empty object: throws a clear, explicit error rather than crashing on undefined property access", () => {
    expect(() => generateContent({} as never)).toThrow("title is required");
  });

  it("undefined input: throws the same clear, explicit error", () => {
    expect(() => generateContent(undefined as never)).toThrow("title is required");
  });

  it("title missing but other fields present: still throws", () => {
    expect(() =>
      generateContent({ author: "Some Author", genre: "fiction" } as never)
    ).toThrow("title is required");
  });
});

describe("generateContent — author", () => {
  it("author missing: defaults to empty string, does not throw, no garbage in text", () => {
    const result = generateContent({ title: "Some Book", genre: "fiction" } as never);
    expect(result.instagramCaption).not.toMatch(GARBAGE_PATTERN);
    expect(result.newsletterBlurb).not.toMatch(GARBAGE_PATTERN);
    expect(result.staffPickCard.note).not.toMatch(GARBAGE_PATTERN);
  });
});

describe("generateContent — genre", () => {
  it("accepts genre and threads through without error, regardless of value", () => {
    const result = generateContent({ title: "Some Book", author: "Some Author", genre: "horror" });
    expect(result.instagramCaption).not.toMatch(GARBAGE_PATTERN);
  });
});

describe("generateContent — messy event_date input", () => {
  it("event_date missing entirely (key omitted): does not throw, event section omitted cleanly", () => {
    const result = generateContent({
      title: "Some Book",
      author: "Some Author",
      genre: "fiction",
      event_title: "Author Meet & Greet",
    });

    expect(result.eventDataIncomplete).toBe(true);
    expect(result.instagramCaption).not.toContain("Join us");
    expect(result.instagramCaption).not.toMatch(GARBAGE_PATTERN);
    expect(result.newsletterBlurb).not.toMatch(GARBAGE_PATTERN);
  });

  it("event_date explicitly empty string: does not throw, treated the same as missing", () => {
    const result = generateContent({
      title: "Some Book",
      author: "Some Author",
      genre: "fiction",
      event_title: "Author Meet & Greet",
      event_date: "",
    });

    expect(result.eventDataIncomplete).toBe(true);
    expect(result.instagramCaption).not.toContain("Join us");
    expect(result.newsletterBlurb).not.toMatch(GARBAGE_PATTERN);
  });

  it("event_date present but in an unexpected (non-ISO) format: does not throw, string passes through verbatim without corruption", () => {
    const result = generateContent({
      title: "Some Book",
      author: "Some Author",
      genre: "fiction",
      event_title: "Author Meet & Greet",
      event_date: "sometime next Tuesday afternoon, TBD",
    });

    expect(result.eventDataIncomplete).toBe(false);
    expect(result.instagramCaption).toContain("sometime next Tuesday afternoon, TBD");
    expect(result.newsletterBlurb).toContain("sometime next Tuesday afternoon, TBD");
    expect(result.newsletterBlurb).not.toMatch(GARBAGE_PATTERN);
  });

  it("event_date present as a whitespace-only string: treated as missing, does not throw", () => {
    const result = generateContent({
      title: "Some Book",
      author: "Some Author",
      genre: "fiction",
      event_title: "Author Meet & Greet",
      event_date: "   ",
    });

    expect(result.eventDataIncomplete).toBe(true);
    expect(result.instagramCaption).not.toContain("Join us");
    expect(result.instagramCaption).not.toMatch(GARBAGE_PATTERN);
    expect(result.newsletterBlurb).not.toMatch(GARBAGE_PATTERN);
  });

  it("event_title missing, event_date present: event section omitted (inherited behavior, not new)", () => {
    const result = generateContent({
      title: "Some Book",
      author: "Some Author",
      genre: "fiction",
      event_date: "2026-09-05T18:30:00Z",
    });

    expect(result.eventDataIncomplete).toBe(false);
    expect(result.instagramCaption).not.toContain("Join us");
    expect(result.instagramCaption).not.toMatch(GARBAGE_PATTERN);
  });
});

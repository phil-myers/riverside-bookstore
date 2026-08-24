import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateContent } from "./contentGenerator.js";
import { fetchBookMetadata } from "../lib/fetchBookMetadata";

// generateContent() calls fetchBookMetadata(), which hits the live Open
// Library API. These tests are about generateContent()'s own handling of
// messy input, not Open Library's availability, so the network call is
// mocked to keep the suite fast, deterministic, and offline-safe.
vi.mock("../lib/fetchBookMetadata", () => ({
  fetchBookMetadata: vi.fn(),
}));

// Catches undefined/null/NaN/[object Object] leaking into user-facing text.
const GARBAGE_PATTERN = /undefined|null|\[object Object\]|NaN/i;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateContent — messy ISBN input", () => {
  it("ISBN missing entirely as empty string: does not throw, skips lookup, no garbage in text", async () => {
    const result = await generateContent({
      book_title: "The Midnight Library",
      author_name: "Matt Haig",
      ISBN: "",
    });

    expect(fetchBookMetadata).not.toHaveBeenCalled();
    expect(result.bookMetadata).toBeNull();
    expect(result.instagramCaption).not.toMatch(GARBAGE_PATTERN);
    expect(result.newsletterBlurb).not.toMatch(GARBAGE_PATTERN);
    expect(result.staffPickCard.title).not.toMatch(GARBAGE_PATTERN);
    expect(result.staffPickCard.note).not.toMatch(GARBAGE_PATTERN);
  });

  it("ISBN missing entirely as an omitted key (undefined): does not throw, skips lookup, no garbage in text", async () => {
    const result = await generateContent({
      book_title: "The Midnight Library",
      author_name: "Matt Haig",
      // ISBN key intentionally omitted
    });

    expect(fetchBookMetadata).not.toHaveBeenCalled();
    expect(result.bookMetadata).toBeNull();
    expect(result.instagramCaption).not.toMatch(GARBAGE_PATTERN);
    expect(result.newsletterBlurb).not.toMatch(GARBAGE_PATTERN);
  });

  it("ISBN wrong length: does not throw, resolves to null cleanly", async () => {
    fetchBookMetadata.mockResolvedValue(null);

    const result = await generateContent({
      book_title: "Some Book",
      author_name: "Some Author",
      ISBN: "123",
    });

    expect(fetchBookMetadata).toHaveBeenCalledWith("123");
    expect(result.bookMetadata).toBeNull();
    expect(result.instagramCaption).not.toMatch(GARBAGE_PATTERN);
    expect(result.newsletterBlurb).not.toMatch(GARBAGE_PATTERN);
  });

  it("ISBN with non-numeric characters: does not throw, resolves to null cleanly", async () => {
    fetchBookMetadata.mockResolvedValue(null);

    const result = await generateContent({
      book_title: "Some Book",
      author_name: "Some Author",
      ISBN: "abc-def-ghij-k",
    });

    expect(fetchBookMetadata).toHaveBeenCalledWith("abc-def-ghij-k");
    expect(result.bookMetadata).toBeNull();
    expect(result.newsletterBlurb).not.toMatch(GARBAGE_PATTERN);
  });

  it("ISBN with a bad check digit (right shape, fails checksum): does not throw, resolves to null cleanly", async () => {
    // 978-0-25713-683-3 is 13 digits but fails the ISBN-13 checksum
    // (verified against live Open Library earlier in this project: no match).
    fetchBookMetadata.mockResolvedValue(null);

    const result = await generateContent({
      book_title: "Some Book",
      author_name: "Some Author",
      ISBN: "978-0-25713-683-3",
    });

    expect(fetchBookMetadata).toHaveBeenCalledWith("978-0-25713-683-3");
    expect(result.bookMetadata).toBeNull();
    expect(result.staffPickCard.note).not.toMatch(GARBAGE_PATTERN);
  });

  it("ISBN well-formed and checksum-valid but unmatched anywhere (Open Library + local catalog both miss): does not throw, resolves to null cleanly", async () => {
    // 978-3-16-148410-0 is a checksum-valid ISBN-13 not present in our
    // local stand-in catalog; mocked here to also simulate an Open
    // Library miss.
    fetchBookMetadata.mockResolvedValue(null);

    const result = await generateContent({
      book_title: "Some Book",
      author_name: "Some Author",
      ISBN: "978-3-16-148410-0",
    });

    expect(fetchBookMetadata).toHaveBeenCalledWith("978-3-16-148410-0");
    expect(result.bookMetadata).toBeNull();
    expect(result.instagramCaption).not.toMatch(GARBAGE_PATTERN);
    expect(result.newsletterBlurb).not.toMatch(GARBAGE_PATTERN);
  });
});

describe("generateContent — messy Author Events input", () => {
  it("Author Events missing entirely (key omitted): does not throw, event section omitted cleanly", async () => {
    const result = await generateContent({
      book_title: "Some Book",
      author_name: "Some Author",
      event_title: "Author Meet & Greet",
      event_description: "A cozy evening of readings and Q&A.",
      // 'Author Events' key intentionally omitted
    });

    expect(result.eventDataIncomplete).toBe(true);
    expect(result.instagramCaption).not.toContain("Join us");
    expect(result.instagramCaption).not.toMatch(GARBAGE_PATTERN);
    expect(result.newsletterBlurb).not.toMatch(GARBAGE_PATTERN);
  });

  it("Author Events explicitly null: does not throw, treated the same as missing", async () => {
    const result = await generateContent({
      book_title: "Some Book",
      author_name: "Some Author",
      event_title: "Author Meet & Greet",
      "Author Events": null,
      event_description: "A cozy evening of readings and Q&A.",
    });

    expect(result.eventDataIncomplete).toBe(true);
    expect(result.instagramCaption).not.toContain("Join us");
    expect(result.newsletterBlurb).not.toMatch(GARBAGE_PATTERN);
  });

  it("Author Events present but in an unexpected (non-ISO) format: does not throw, string passes through verbatim without corruption", async () => {
    const result = await generateContent({
      book_title: "Some Book",
      author_name: "Some Author",
      event_title: "Author Meet & Greet",
      "Author Events": "sometime next Tuesday afternoon, TBD",
      event_description: "A cozy evening of readings and Q&A.",
    });

    expect(result.eventDataIncomplete).toBe(false);
    expect(result.instagramCaption).toContain("sometime next Tuesday afternoon, TBD");
    expect(result.newsletterBlurb).toContain("sometime next Tuesday afternoon, TBD");
    expect(result.newsletterBlurb).not.toMatch(GARBAGE_PATTERN);
  });

  it("Author Events present as a whitespace-only string: treated as missing, does not throw", async () => {
    const result = await generateContent({
      book_title: "Some Book",
      author_name: "Some Author",
      event_title: "Author Meet & Greet",
      "Author Events": "   ",
      event_description: "A cozy evening of readings and Q&A.",
    });

    expect(result.eventDataIncomplete).toBe(true);
    expect(result.instagramCaption).not.toContain("Join us");
    expect(result.instagramCaption).not.toMatch(GARBAGE_PATTERN);
    expect(result.newsletterBlurb).not.toMatch(GARBAGE_PATTERN);
  });
});

describe("generateContent — fully empty input", () => {
  it("completely empty object: throws a clear, explicit error rather than crashing on undefined property access", async () => {
    await expect(generateContent({})).rejects.toThrow("book_title is required");
  });

  it("undefined input: throws the same clear, explicit error", async () => {
    await expect(generateContent(undefined)).rejects.toThrow("book_title is required");
  });
});

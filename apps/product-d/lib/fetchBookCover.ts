/**
 * Fetches a book cover image URL from Open Library's search API.
 * Separate from fetchBookMetadata.ts (Open Library -> Google Books
 * migration, PR #3) — this is purely for cover art and always talks
 * to Open Library directly.
 */

interface OpenLibrarySearchDoc {
  cover_i?: number;
}

interface OpenLibrarySearchResponse {
  docs?: OpenLibrarySearchDoc[];
}

export async function fetchBookCover(title: string, author: string): Promise<string | null> {
  if (!title) return null;

  const params = new URLSearchParams({ title, author });
  const url = `https://openlibrary.org/search.json?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data: OpenLibrarySearchResponse = await res.json();
    const match = data.docs?.find((doc) => typeof doc.cover_i === "number");
    if (!match || match.cover_i === undefined) return null;

    return `https://covers.openlibrary.org/b/id/${match.cover_i}-M.jpg`;
  } catch {
    return null;
  }
}

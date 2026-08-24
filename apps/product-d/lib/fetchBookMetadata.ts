import { localCatalog } from "./localCatalog";

/**
 * This module is the only place Open Library data enters the app.
 * generateContent() should call fetchBookMetadata() for book details
 * rather than fetching from Open Library directly.
 */

export type Genre = "fiction" | "nonfiction" | "children's" | "mystery" | "general";

export type Source = "openlibrary" | "local-fallback";

export interface BookMetadata {
  title: string;
  author: string;
  coverUrl: string | null;
  genre: Genre;
  source: Source;
}

interface OpenLibraryBookEntry {
  title?: string;
  authors?: { name: string }[];
  cover?: { small?: string; medium?: string; large?: string };
  subjects?: { name: string }[];
}

// Checked in order; the first genre whose keywords match any subject wins.
const GENRE_KEYWORD_RULES: [Genre, string[]][] = [
  ["children's", ["juvenile", "children", "picture book", "kids", "young readers"]],
  ["mystery", ["mystery", "detective", "crime", "thriller", "suspense"]],
  ["nonfiction", ["nonfiction", "non-fiction", "biography", "autobiography", "history", "science", "essay", "memoir", "self-help"]],
  ["fiction", ["fiction", "novel", "fantasy", "literature"]],
];

function mapSubjectsToGenre(subjects: string[]): Genre {
  const lowered = subjects.map((s) => s.toLowerCase());
  for (const [genre, keywords] of GENRE_KEYWORD_RULES) {
    if (lowered.some((subject) => keywords.some((keyword) => subject.includes(keyword)))) {
      return genre;
    }
  }
  return "general";
}

function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[^0-9Xx]/g, "").toUpperCase();
}

const cache = new Map<string, BookMetadata | null>();

async function fetchFromOpenLibrary(isbn: string): Promise<BookMetadata | null> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const entry: OpenLibraryBookEntry | undefined = data[`ISBN:${isbn}`];
  if (!entry || !entry.title) return null;

  const subjects = (entry.subjects ?? []).map((s) => s.name);

  return {
    title: entry.title,
    author: entry.authors?.[0]?.name ?? "Unknown",
    coverUrl: entry.cover?.medium ?? entry.cover?.large ?? entry.cover?.small ?? null,
    genre: mapSubjectsToGenre(subjects),
    source: "openlibrary",
  };
}

export async function fetchBookMetadata(isbn: string): Promise<BookMetadata | null> {
  const key = normalizeIsbn(isbn);
  if (!key) return null;

  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  let result: BookMetadata | null;
  try {
    result = await fetchFromOpenLibrary(key);
  } catch {
    result = null;
  }

  if (!result && process.env.USE_LOCAL_CATALOG_FALLBACK === "true") {
    result = localCatalog[key] ?? null;
  }

  cache.set(key, result);
  return result;
}

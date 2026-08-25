import type { BookMetadata } from "./fetchBookMetadata";

/**
 * Local stand-in catalog data. Used only as a fallback when the Open
 * Library API call fails or has no match, gated behind
 * USE_LOCAL_CATALOG_FALLBACK. Titles/authors are real books chosen to
 * cover each genre bucket for testing; cover images aren't available
 * locally, so coverUrl is always null here.
 *
 * Keyed by ISBN with all non-digit characters stripped (see
 * normalizeIsbn in fetchBookMetadata.ts).
 */
export const localCatalog: Record<string, BookMetadata> = {
  "9780547928227": {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    coverUrl: null,
    genre: "fiction",
    source: "local-fallback",
  },
  "9780316769488": {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    coverUrl: null,
    genre: "fiction",
    source: "local-fallback",
  },
  "9780061120084": {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    coverUrl: null,
    genre: "fiction",
    source: "local-fallback",
  },
  "9780439023528": {
    title: "The Hunger Games",
    author: "Suzanne Collins",
    coverUrl: null,
    genre: "fiction",
    source: "local-fallback",
  },
  "9780064400558": {
    title: "Charlotte's Web",
    author: "E.B. White",
    coverUrl: null,
    genre: "children's",
    source: "local-fallback",
  },
  "9780062316097": {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    coverUrl: null,
    genre: "nonfiction",
    source: "local-fallback",
  },
  "9780307454546": {
    title: "The Girl with the Dragon Tattoo",
    author: "Stieg Larsson",
    coverUrl: null,
    genre: "mystery",
    source: "local-fallback",
  },
};

#!/usr/bin/env node
// One-time backfill: looks up a cover image URL for every ISBN in the live shared `books` table
// (Google Books first, Open Library as a fallback for real coverage gaps) and writes the results
// to a static JSON file committed into each product that needs one. No live API calls at
// runtime, no write access to the shared table -- see SPEC.md for why.
//
// Usage: node scripts/fetch-book-covers.mjs
// Rerun by hand whenever the catalog changes -- this does not run automatically.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal(relPath) {
  const text = readFileSync(path.join(repoRoot, relPath), "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnvLocal("apps/product-a/.env.local");
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GOOGLE_BOOKS_API_KEY = env.GOOGLE_BOOKS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY in apps/product-a/.env.local");
  process.exit(1);
}

// Same checksum check as apps/product-a/lib/googleBooks.ts -- some ISBNs in this repo's fixtures
// fail ISBN-13 checksum, and Google's fuzzy `q=isbn:` search matches bad input to the wrong book
// instead of erroring, so invalid ISBNs are rejected before querying rather than trusted.
function isValidIsbn13(isbn) {
  const digits = isbn.replace(/-/g, "");
  if (!/^\d{13}$/.test(digits)) return false;
  const sum = digits
    .slice(0, 12)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(digits[12]);
}

async function fetchIsbnList() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/books?select=isbn,title`, {
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
  return res.json();
}

async function fetchFromGoogleBooks(isbn) {
  if (!GOOGLE_BOOKS_API_KEY || !isValidIsbn13(isbn)) return null;
  const cleanIsbn = isbn.replace(/-/g, "");
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&key=${GOOGLE_BOOKS_API_KEY}`;

  let response;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await fetch(url);
    } catch {
      return null;
    }
    if (response.ok) break;
    if (attempt === 0 && response.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  if (!response || !response.ok) return null;

  const data = await response.json();
  const thumbnail = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
  if (!thumbnail) return null;
  return thumbnail.replace(/^http:/, "https:");
}

async function fetchFromOpenLibrary(isbn) {
  const cleanIsbn = isbn.replace(/-/g, "");
  const url = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
  try {
    // A real GET, not HEAD: Open Library doesn't send Content-Length on HEAD responses (verified
    // directly -- confirmed empty for both a real cover and a made-up ISBN), so HEAD can't tell a
    // real cover apart from Open Library's tiny 1x1 "no cover" placeholder GIF (43 bytes,
    // confirmed identical for a fake ISBN and a real one with no indexed cover). Downloading the
    // body and checking its actual byte length is the only reliable signal.
    const res = await fetch(url);
    if (!res.ok) return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength < 1000) return null;
    return url;
  } catch {
    return null;
  }
}

async function main() {
  const books = await fetchIsbnList();
  console.log(`Fetching covers for ${books.length} books...`);

  const result = {};
  for (const book of books) {
    const isbn = book.isbn;
    let coverUrl = await fetchFromGoogleBooks(isbn);
    let source = coverUrl ? "google-books" : null;
    if (!coverUrl) {
      coverUrl = await fetchFromOpenLibrary(isbn);
      source = coverUrl ? "open-library" : null;
    }
    result[isbn] = { coverUrl, source };
    console.log(`  ${isbn} (${book.title}): ${coverUrl ? `found via ${source}` : "no cover found"}`);
  }

  const json = JSON.stringify(result, null, 2) + "\n";
  const targets = [
    path.join(repoRoot, "apps/product-a/lib/bookCovers.json"),
    path.join(repoRoot, "apps/product-b/lib/bookCovers.json"),
  ];
  for (const target of targets) {
    writeFileSync(target, json);
    console.log(`Wrote ${target}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

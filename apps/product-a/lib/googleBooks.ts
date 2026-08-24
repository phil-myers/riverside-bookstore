type GoogleBooksVolume = {
  volumeInfo?: {
    imageLinks?: {
      thumbnail?: string;
    };
  };
};

type GoogleBooksResponse = {
  totalItems: number;
  items?: GoogleBooksVolume[];
};

export type GoogleBooksLookup = {
  found: boolean;
  coverImageUrl: string | null;
};

const NOT_FOUND: GoogleBooksLookup = { found: false, coverImageUrl: null };

// Some ISBNs in the team's synthetic dataset fail ISBN-13 checksum (confirmed live: Circe's
// listed ISBN, 978-0-316-55635-9, does not check out, and Google's fuzzy `q=isbn:` search
// matched it to an unrelated book's cover instead of erroring). Reject invalid ISBNs before
// querying rather than trust whatever Google matches against bad input.
function isValidIsbn13(isbn: string): boolean {
  const digits = isbn.replace(/-/g, "");
  if (!/^\d{13}$/.test(digits)) {
    return false;
  }
  const sum = digits
    .slice(0, 12)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(digits[12]);
}

// Server-side only: reads GOOGLE_BOOKS_API_KEY (no NEXT_PUBLIC_ prefix), so it must run in a
// Server Component or route handler, never shipped to the browser bundle.
export async function getBookCoverByIsbn(isbn: string): Promise<GoogleBooksLookup> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey || !isValidIsbn13(isbn)) {
    return NOT_FOUND;
  }

  const cleanIsbn = isbn.replace(/-/g, "");
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&key=${apiKey}`;

  // Google Books returns intermittent 5xx under bursts of requests (confirmed live: same ISBN
  // that 503'd once returned 200 moments later) — one retry clears most of these without masking
  // a real outage behind an infinite loop.
  let response: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await fetch(url, { next: { revalidate: 86400 } });
    } catch {
      return NOT_FOUND;
    }
    if (response.ok) break;
    if (attempt === 0 && response.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  if (!response || !response.ok) {
    return NOT_FOUND;
  }

  const data = (await response.json()) as GoogleBooksResponse;
  const thumbnail = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;

  if (!thumbnail) {
    return NOT_FOUND;
  }

  // Google Books serves cover thumbnails over http:// by default; upgrade to https so the
  // browser doesn't block them as mixed content on an https-served page.
  return { found: true, coverImageUrl: thumbnail.replace(/^http:/, "https:") };
}

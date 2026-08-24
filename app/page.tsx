"use client";

import { useRef, useState } from "react";
import { generateContent } from "../lib/generator";
import { fetchBookCover } from "../lib/fetchBookCover";

type ContentType = "instagram" | "newsletter" | "staffpick";

interface GeneratedContent {
  type: ContentType;
  label: string;
  text: string;
}

// Local to the UI layer only — mirrors the bucket vocabulary used in
// fetchBookMetadata.ts's genre detection, but doesn't import from it,
// since the form's genre field is free text typed by staff, not the
// Open Library-derived Genre type.
const GENRE_KEYWORDS: [string, string[]][] = [
  ["children's", ["child", "picture book", "middle grade"]],
  ["horror", ["horror"]],
  ["mystery", ["mystery", "detective", "crime", "thriller", "suspense"]],
  ["romance", ["romance", "love stor"]],
  ["self-help", ["self-help", "self help", "self-improvement", "motivat", "personal development"]],
  ["cookbook", ["cook", "recipe"]],
  ["nonfiction", ["nonfiction", "non-fiction", "biography", "memoir", "history", "science", "essay"]],
  ["fiction", ["fiction", "novel", "fantasy", "literary"]],
];

// Every strip color is a dark tint/shade from the Forest/Ink/Stamp family —
// kept dark enough that Card-colored text stays legible on top of it.
const GENRE_ACCENTS: Record<string, { strip: string; label: string }> = {
  fiction: { strip: "#2f4a3d", label: "Fiction" },
  nonfiction: { strip: "#4a443c", label: "Nonfiction" },
  mystery: { strip: "#3b2e4a", label: "Mystery" },
  horror: { strip: "#5c2a22", label: "Horror" },
  romance: { strip: "#7a3b52", label: "Romance" },
  "self-help": { strip: "#a47f1e", label: "Self-Help" },
  cookbook: { strip: "#93461f", label: "Cookbook" },
  "children's": { strip: "#43664b", label: "Children's" },
  general: { strip: "#2f4a3d", label: "General" },
};

function getGenreAccent(genre: string) {
  const lower = genre.toLowerCase();
  for (const [bucket, keywords] of GENRE_KEYWORDS) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return GENRE_ACCENTS[bucket];
    }
  }
  return GENRE_ACCENTS.general;
}

export default function Home() {
  const [bookTitle, setBookTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [genre, setGenre] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventWarning, setEventWarning] = useState(false);
  const [results, setResults] = useState<GeneratedContent[] | null>(null);
  const [stamped, setStamped] = useState(false);
  const [copiedType, setCopiedType] = useState<ContentType | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const coverRequestId = useRef(0);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!bookTitle) {
      setTitleError(true);
      return;
    }
    setTitleError(false);
    if (!authorName) return;
    const content = generateContent({
      title: bookTitle,
      author: authorName,
      genre,
      event_title: eventTitle,
      event_date: eventDate,
    });
    setEventWarning(Boolean(content.eventDataIncomplete));
    setResults([
      { type: "instagram", label: "Instagram", text: content.instagramCaption },
      { type: "newsletter", label: "Newsletter", text: content.newsletterBlurb },
      {
        type: "staffpick",
        label: "Staff Pick Card",
        text: `${content.staffPickCard.title}\n\n${content.staffPickCard.note}`,
      },
    ]);
    setStamped(false);
    setTimeout(() => setStamped(true), 400);

    setCoverUrl(null);
    const requestId = ++coverRequestId.current;
    fetchBookCover(bookTitle, authorName).then((url) => {
      if (coverRequestId.current === requestId) {
        setCoverUrl(url);
      }
    });
  }

  async function handleCopy(type: ContentType, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1500);
  }

  return (
    <main className="min-h-screen bg-stone px-6 py-12 md:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-forest">
            Riverside Books · Staff Tool
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink md:text-5xl">
            Content Generator
          </h1>
        </header>

        <div className="grid gap-8 md:grid-cols-[380px_1fr]">
          {/* Form styled like a library card */}
          <form
            onSubmit={handleGenerate}
            className="h-fit rounded-sm border border-ink/15 bg-card p-6 shadow-sm"
          >
            <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-ink/50">
              Catalog Entry
            </p>

            <label
              className={`block border-b py-3 ${
                titleError ? "border-red-400" : "border-ink/20"
              }`}
            >
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
                Book Title
              </span>
              <input
                value={bookTitle}
                onChange={(e) => {
                  setBookTitle(e.target.value);
                  setTitleError(false);
                }}
                className={`mt-1 w-full bg-transparent font-body placeholder:italic placeholder:text-gray-400 outline-none ${
                  titleError ? "text-red-600" : "text-ink"
                }`}
                placeholder="The Midnight Library"
              />
              {titleError && (
                <p className="mt-1 font-mono text-[10px] text-red-600">
                  Book title is required.
                </p>
              )}
            </label>

            <label className="block border-b border-ink/20 py-3">
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
                Author Name
              </span>
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="mt-1 w-full bg-transparent font-body text-ink placeholder:italic placeholder:text-gray-400 outline-none"
                placeholder="Matt Haig"
                required
              />
            </label>

            <label className="block border-b border-ink/20 py-3">
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
                Genre
              </span>
              <input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="mt-1 w-full bg-transparent font-body text-ink placeholder:italic placeholder:text-gray-400 outline-none"
                placeholder="fiction"
                required
              />
            </label>

            <label className="block border-b border-ink/20 py-3">
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
                Event Title
              </span>
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="mt-1 w-full bg-transparent font-body text-ink placeholder:italic placeholder:text-gray-400 outline-none"
                placeholder="Author Meet & Greet"
              />
            </label>

            <label className="block py-3">
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
                Event Date/Time
              </span>
              <input
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-1 w-full bg-transparent font-body text-ink placeholder:italic placeholder:text-gray-400 outline-none"
                placeholder="Sept 5, 6:30pm"
              />
            </label>

            <button
              type="submit"
              className="mt-4 w-full rounded-sm bg-forest py-3 font-mono text-xs uppercase tracking-widest text-card transition hover:opacity-90"
            >
              Generate
            </button>
          </form>

          <div className="space-y-4">
            {results && eventWarning && (
              <div className="rounded-sm border border-red-400 bg-red-50 px-4 py-3 font-mono text-xs text-red-700">
                Event details incomplete — check event title and event date
                before publishing.
              </div>
            )}

            {/* Output cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results ? (
                results.map((item) => {
                  const accent = getGenreAccent(genre);
                  return (
                    <div
                      key={item.type}
                      className="relative overflow-hidden rounded-sm border border-ink/15 bg-card shadow-sm"
                    >
                      <div
                        className="flex items-center justify-between px-4 py-2"
                        style={{ backgroundColor: accent.strip }}
                      >
                        <span className="font-mono text-[10px] uppercase tracking-widest text-card">
                          {item.label}
                        </span>
                        <span
                          role="status"
                          aria-label="Generated"
                          className={`relative flex h-11 w-11 shrink-0 rotate-[-8deg] items-center justify-center rounded-full bg-stamp/10 transition-all duration-300 ease-out ${
                            stamped ? "scale-100 opacity-90" : "scale-50 opacity-0"
                          }`}
                        >
                          <span className="absolute inset-0 rounded-full border-2 border-stamp" />
                          <span className="absolute inset-[3px] rounded-full border border-stamp/70" />
                          <span className="font-mono text-[7px] font-semibold uppercase tracking-[0.15em] text-stamp">
                            OK
                          </span>
                        </span>
                      </div>

                      <div className="p-5">
                        {coverUrl && (
                          <div className="mb-3 inline-block rounded-[2px] border border-ink/20 bg-card p-1 shadow-sm">
                            <img
                              src={coverUrl}
                              alt={`Cover of ${bookTitle}`}
                              className="h-32 w-auto rounded-[1px] object-cover"
                            />
                          </div>
                        )}
                        <div className="mb-3">
                          <span
                            className="inline-block rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                            style={{
                              borderColor: accent.strip,
                              color: accent.strip,
                              backgroundColor: `${accent.strip}1a`,
                            }}
                          >
                            {accent.label}
                          </span>
                        </div>
                        <p className="whitespace-pre-line font-body text-sm leading-relaxed text-ink">
                          {item.text}
                        </p>
                        <button
                          onClick={() => handleCopy(item.type, item.text)}
                          className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink/50 underline underline-offset-4 hover:text-ink"
                        >
                          {copiedType === item.type ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full flex h-64 items-center justify-center rounded-sm border border-dashed border-ink/20 text-center">
                  <p className="max-w-xs font-mono text-xs uppercase tracking-widest text-ink/40">
                    Fill in a catalog entry to generate content
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

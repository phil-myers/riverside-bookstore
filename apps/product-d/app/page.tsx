"use client";

import { useState } from "react";
import { generateContent } from "./contentGenerator";

type ContentType = "instagram" | "newsletter" | "staffpick";

interface GeneratedContent {
  type: ContentType;
  label: string;
  text: string;
}

export default function Home() {
  const [bookTitle, setBookTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [isbn, setIsbn] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDateTime, setEventDateTime] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventWarning, setEventWarning] = useState(false);
  const [results, setResults] = useState<GeneratedContent[] | null>(null);
  const [stamped, setStamped] = useState(false);
  const [copiedType, setCopiedType] = useState<ContentType | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!bookTitle) {
      setTitleError(true);
      return;
    }
    setTitleError(false);
    if (!authorName) return;
    const content = await generateContent({
      book_title: bookTitle,
      author_name: authorName,
      ISBN: isbn,
      event_title: eventTitle,
      "Author Events": eventDateTime,
      event_description: eventDescription,
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
                ISBN
              </span>
              <input
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="mt-1 w-full bg-transparent font-body text-ink placeholder:italic placeholder:text-gray-400 outline-none"
                placeholder="978-0-14-311830-4"
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

            <label className="block border-b border-ink/20 py-3">
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
                Event Date/Time
              </span>
              <input
                value={eventDateTime}
                onChange={(e) => setEventDateTime(e.target.value)}
                className="mt-1 w-full bg-transparent font-body text-ink placeholder:italic placeholder:text-gray-400 outline-none"
                placeholder="Sept 5, 6:30pm"
              />
            </label>

            <label className="block py-3">
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
                Event Description
              </span>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="mt-1 w-full resize-none bg-transparent font-body text-ink placeholder:italic placeholder:text-gray-400 outline-none"
                placeholder="A cozy evening of readings and Q&A."
                rows={2}
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
                Event details incomplete — check Author Events, event title,
                and description before publishing.
              </div>
            )}

            {/* Output cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results ? (
                results.map((item) => (
                  <div
                    key={item.type}
                    className="relative overflow-hidden rounded-sm border border-ink/15 bg-card p-5 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-forest">
                        {item.label}
                      </span>
                      <span
                        className={`rotate-[-8deg] rounded-sm border-2 border-stamp px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-stamp transition-all duration-300 ease-out ${
                          stamped ? "scale-100 opacity-80" : "scale-50 opacity-0"
                        }`}
                      >
                        Generated
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
                ))
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

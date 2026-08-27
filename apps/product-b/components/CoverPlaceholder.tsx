// A generated stand-in for books with no real cover (invalid ISBN in the live table, or Google
// Books / Open Library just don't have one) -- a gradient card with the title, instead of a flat
// "No cover" box. Not real artwork: no image-generation tool is available here.
const GRADIENTS = [
  "from-[#3F6C51] to-[#1B2E28]",
  "from-[#B08D3F] to-[#7A2E2E]",
  "from-[#1B2E28] to-[#3F6C51]",
  "from-[#7A2E2E] to-[#B08D3F]",
];

function gradientFor(isbn: string): string {
  let hash = 0;
  for (const char of isbn) hash = (hash * 31 + char.charCodeAt(0)) % GRADIENTS.length;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function CoverPlaceholder({
  title,
  isbn,
  className,
}: {
  title: string;
  isbn: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br p-1 text-center ${gradientFor(isbn)} ${className ?? ""}`}
    >
      <span className="line-clamp-3 font-serif text-[6px] font-semibold leading-tight text-paper">
        {title}
      </span>
    </div>
  );
}

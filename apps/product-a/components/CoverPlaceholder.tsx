// A generated stand-in for books with no real cover (invalid ISBN in the live table, or Google
// Books / Open Library just don't have one) -- a gradient card with the title, instead of a flat
// "No cover" box. Not real artwork: no image-generation tool is available here.
const GRADIENTS = [
  "from-emerald-500 to-emerald-700",
  "from-teal-500 to-cyan-700",
  "from-sky-500 to-blue-700",
  "from-violet-500 to-purple-700",
  "from-rose-500 to-pink-700",
  "from-amber-500 to-orange-700",
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
      <span className="line-clamp-4 text-[8px] font-semibold leading-tight text-white">
        {title}
      </span>
    </div>
  );
}

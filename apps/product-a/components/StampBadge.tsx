// The signature status element -- styled like a library due-date ink stamp (dashed ring, slight
// rotation, small-caps mono label). Same idea as Jeffrey's separate project's stamp-badge.tsx,
// rebuilt here since this is a different codebase, not a shared import.
export type StampTone = "positive" | "pending" | "negative";

const TONE_CLASSES: Record<StampTone, string> = {
  positive: "border-accent text-accent",
  pending: "border-gold text-gold",
  negative: "border-claret text-claret",
};

const TONE_ROTATION: Record<StampTone, string> = {
  positive: "-rotate-2",
  pending: "rotate-1",
  negative: "-rotate-1",
};

export function StampBadge({
  children,
  tone,
  className = "",
}: {
  children: React.ReactNode;
  tone: StampTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border-2 border-dashed px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${TONE_CLASSES[tone]} ${TONE_ROTATION[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

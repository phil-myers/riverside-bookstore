"use client";

export function CartToast({ message }: { message: string | null }) {
  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center transition-all duration-300 ${
        message ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      {message && (
        <p className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper shadow-lg">
          {message}
        </p>
      )}
    </div>
  );
}

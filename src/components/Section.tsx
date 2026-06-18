import { type ReactNode } from "react";

// Standard report section card with an auto-numbered, accented header. When no
// title is given, the card renders without the header (e.g. a combined section
// where each inner table carries its own header).
export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="section-card w-full rounded-2xl border border-amber-200/70 bg-white p-6 shadow-sm ring-1 ring-amber-100/50 transition-shadow hover:shadow-md md:p-8">
      {title && (
        <h2 className="mb-6 flex items-center gap-3 border-b border-amber-200/70 pb-3 text-2xl font-bold tracking-tight text-amber-900">
          <span
            className="section-index font-mono text-base font-semibold tabular-nums text-amber-400"
            aria-hidden="true"
          />
          <span className="h-7 w-1.5 shrink-0 rounded-full bg-amber-400" />
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

// Placeholder shown before a birth date is entered.
export function EmptyHint() {
  return (
    <p className="mt-2 leading-relaxed text-zinc-500">
      请在输入您的出生日期以生成您的故事。
    </p>
  );
}

'use client';

export type ChartMode = "normal" | "shadow";

// Two-button segmented toggle: 个人蓝图 (the chart as-is) vs 影子数字 (every number
// doubled). Used at the bottom-right of the chart sections.
export function ChartModeToggle({
  mode,
  onChange,
}: {
  mode: ChartMode;
  onChange: (mode: ChartMode) => void;
}) {
  const btn = (m: ChartMode, label: string) => (
    <button
      type="button"
      onClick={() => onChange(m)}
      aria-pressed={mode === m}
      className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
        mode === m
          ? "bg-amber-500 text-white shadow-sm"
          : "text-amber-700 hover:bg-amber-100 hover:text-amber-900"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="inline-flex gap-0.5 rounded-lg border border-amber-200 p-0.5 print:hidden">
      {btn("normal", "个人蓝图")}
      {btn("shadow", "影子数字")}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from "react";

// Sticky table-of-contents for jumping between report sections (desktop only).
const NAV_ITEMS = [
  { id: "sec-input", label: "核心资料" },
  { id: "sec-chart", label: "个人图表" },
  { id: "sec-summary", label: "总体故事" },
  { id: "sec-story", label: "数字故事" },
  { id: "sec-hidden", label: "隐藏性格" },
  { id: "sec-ability", label: "能力分布" },
  { id: "sec-health", label: "健康关系" },
  { id: "sec-career", label: "事业选择" },
  { id: "sec-directions", label: "最好方向" },
];

export function SectionNav() {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Collapse when clicking outside the nav — but not when dragging (e.g. text
  // selection), detected by how far the pointer moved between press and release.
  useEffect(() => {
    if (!open) return;
    let startX = 0;
    let startY = 0;
    const onDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (moved > 6) return; // treat as a drag, not a click
      if (navRef.current?.contains(e.target as Node)) return; // inside the nav
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
    };
  }, [open]);

  return (
    <nav ref={navRef} className="fixed left-0 top-24 z-40">
      {open ? (
        <div className="ml-2 max-h-[80vh] w-44 overflow-y-auto rounded-xl border border-amber-200/70 bg-white/85 p-3 shadow-lg ring-1 ring-amber-100/50 backdrop-blur">
          <button
            type="button"
            className="mb-3 w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
          >
            登录
          </button>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              目录
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="收起目录"
              title="收起目录"
              className="flex h-6 w-6 items-center justify-center rounded-md text-amber-600 transition hover:bg-amber-100 hover:text-amber-900"
            >
              «
            </button>
          </div>
          <ul className="space-y-1 border-l-2 border-amber-200 pl-3">
            {NAV_ITEMS.map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="flex items-center gap-2 py-1 text-sm text-amber-700/70 transition hover:font-semibold hover:text-amber-900"
                >
                  <span className="font-mono text-xs tabular-nums text-amber-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="展开目录"
          title="展开目录"
          className="flex h-12 w-9 items-center justify-center rounded-r-xl border border-l-0 border-amber-200/70 bg-white/85 text-amber-700 shadow-md ring-1 ring-amber-100/50 backdrop-blur transition hover:bg-amber-100 hover:text-amber-900"
        >
          ☰
        </button>
      )}
    </nav>
  );
}

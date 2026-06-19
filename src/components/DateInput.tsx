'use client';

import { useEffect, useRef, useState } from "react";

// "YYYY-MM-DD" → "DD/MM/YYYY" (empty unless it's a full ISO date).
function toDisplay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

// "DD/MM/YYYY" → "YYYY-MM-DD" (empty unless it's a complete, real calendar date).
function toIso(display: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
  if (!m) return "";
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1) return "";
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// Once a full date is typed, clamp the day to the last valid day of that month
// (year-aware, so 31/02 → 29 in a leap year else 28; 31/04 → 30; etc.).
function clampDay(display: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
  if (!m) return display;
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12) return display;
  const last = new Date(year, month, 0).getDate();
  if (Number(m[1]) <= last) return display;
  return `${String(last).padStart(2, "0")}/${m[2]}/${m[3]}`;
}

// Build a DD/MM/YYYY string from the raw input, auto-correcting as the user types:
//  • a first digit that can't begin a valid field is padded and advanced
//    (month ≥ 2 → 0X, day ≥ 4 → 0X);
//  • typing "/" pads a single digit (1 → 01) and moves to the next field;
//  • a second digit that would make the field invalid (month > 12, day > 31) is
//    rejected.
function smartFormat(raw: string): string {
  let day = "";
  let month = "";
  let year = "";
  let seg = 0; // 0 = day, 1 = month, 2 = year

  for (const ch of raw) {
    if (ch === "/") {
      if (seg === 0) {
        if (day.length === 1 && Number(day) >= 1) { day = "0" + day; seg = 1; }
        else if (day.length === 2) seg = 1;
      } else if (seg === 1) {
        if (month.length === 1 && Number(month) >= 1) { month = "0" + month; seg = 2; }
        else if (month.length === 2) seg = 2;
      }
      continue;
    }
    if (!/\d/.test(ch)) continue;

    if (seg === 0) {
      if (day.length === 0) {
        if (Number(ch) >= 4) { day = "0" + ch; seg = 1; } // 4–9 can't start a 2-digit day
        else day = ch; // 0–3: wait for the second digit
      } else if (day.length === 1) {
        const n = Number(day + ch);
        if (n >= 1 && n <= 31) { day = day + ch; seg = 1; } // else reject the digit
      }
    } else if (seg === 1) {
      if (month.length === 0) {
        if (Number(ch) >= 2) { month = "0" + ch; seg = 2; } // 2–9 can't start a 2-digit month
        else month = ch; // 0 or 1: wait
      } else if (month.length === 1) {
        const n = Number(month + ch);
        if (n >= 1 && n <= 12) { month = month + ch; seg = 2; } // else reject
      }
    } else if (year.length < 4) {
      year += ch;
    }
  }

  let out = day;
  if (seg >= 1) out += "/" + month;
  if (seg >= 2) out += "/" + year;
  return out;
}

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

// A date field that always reads/writes DD/MM/YYYY regardless of the device
// locale (a native <input type="date"> shows the OS-locale format, which can't
// be forced), while still offering a calendar picker. The committed value stays
// ISO "YYYY-MM-DD" so the rest of the app is unchanged.
export function DateInput({
  id,
  value,
  onChange,
  className,
}: {
  id?: string;
  value: string;
  onChange: (isoValue: string) => void;
  className?: string;
}) {
  const [text, setText] = useState(() => toDisplay(value));
  const prev = useRef(text);
  const pickerRef = useRef<HTMLInputElement>(null);

  // Reflect external value changes (storage restore, the calendar picker, a
  // programmatic clear), but don't clobber a half-typed entry that already
  // matches `value`.
  useEffect(() => {
    if (toIso(text) !== value) {
      const next = toDisplay(value);
      setText(next);
      prev.current = next;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleType = (raw: string) => {
    // On deletion, accept what's left as-is so backspacing past auto-inserted
    // slashes feels natural; otherwise auto-correct.
    const next =
      raw.length < prev.current.length
        ? raw.replace(/[^\d/]/g, "")
        : clampDay(smartFormat(raw));
    prev.current = next;
    setText(next);
    onChange(toIso(next));
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD/MM/YYYY"
        maxLength={10}
        value={text}
        onChange={(e) => handleType(e.target.value)}
        className={className}
        style={{ paddingRight: "2.5rem" }}
      />
      {/* Calendar button → opens the OS date picker via a transparent native
          date input layered over the icon (its locale display is hidden). */}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-amber-600">
        <CalendarIcon />
      </span>
      <input
        ref={pickerRef}
        type="date"
        aria-label="选择日期"
        tabIndex={-1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          // Force the calendar open even when the field already has a value
          // (a plain click would otherwise just focus a date segment).
          const el = e.currentTarget;
          if (typeof el.showPicker === "function") {
            try {
              el.showPicker();
            } catch {
              /* not allowed in this context — fall back to default click */
            }
          }
        }}
        suppressHydrationWarning
        className="absolute right-0 top-0 h-full w-11 cursor-pointer opacity-0"
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from "react";
import { Section } from "../../components/Section";
import { BaseChart } from "../../components/BaseChart";
import { chartFromMiddle, reduceToSingle } from "../../lib/numerology";
import { usePersistedState } from "../../lib/usePersistedState";

// Reference table (the hand-drawn diagrams): final reduced number → the two
// middle numbers of its chart. The rest of the pyramid is derived from these.
// Most finals map to a single diagram; final 1 has two (the user picks by
// clicking the diagram to toggle between them). 5 and 8 have no diagram.
const MIDDLE_BY_FINAL: Record<number, [number, number][]> = {
  1: [
    [7, 1],
    [1, 1],
  ],
  2: [[1, 2]],
  3: [[4, 3]],
  4: [[1, 4]],
  6: [[7, 6]],
  7: [[4, 7]],
  9: [[1, 9]],
};

const inputClass =
  "w-full rounded-md border border-amber-200 px-3 py-2 text-zinc-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200";
const fieldClass = "flex min-w-0 flex-1 flex-col gap-1";
const labelClass = "text-left text-sm font-medium text-zinc-700";

// Split a 4-digit year into its two halves, each reduced to a single digit.
// "1989" → { a: "19", b: "89", ra: 1, rb: 8 }
function splitYear(yr: string) {
  if (!/^\d{4}$/.test(yr)) return null;
  return {
    a: yr.slice(0, 2),
    b: yr.slice(2, 4),
    ra: reduceToSingle(Number(yr.slice(0, 2))),
    rb: reduceToSingle(Number(yr.slice(2, 4))),
  };
}

const show = (n: number | string | null | undefined) =>
  n == null || n === "" || (typeof n === "number" && Number.isNaN(n)) ? "–" : n;

// The top diagram line is the two reference lines added column-wise. The 1st
// number has no addend (the circle is empty), so it's deduced instead: the digit
// d in 1–9 such that reduce(d + second) equals the left-middle target.
function deduceFirst(target: number, second: number): number {
  if (Number.isNaN(target) || Number.isNaN(second)) return NaN;
  const d = (((target - second) % 9) + 9) % 9;
  return d === 0 ? 9 : d;
}

// Days in a given month (handles 30/31 and February leap years).
function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

// Column centres (% of width) of the diagram's top tier — see BaseChart's
// reducedX [188,329,471,612] over the 800-wide viewBox. The reference lines use
// these so both lines line up with each other and with the diagram's first row.
const TOP_COLS = [23.5, 41.125, 58.875, 76.5];

// One reference line: four cells positioned at the diagram's top-tier columns.
function RefLine({ cells }: { cells: React.ReactNode[] }) {
  return (
    <div className="relative h-[5.5cqw]">
      {cells.map((c, i) => (
        <span
          key={i}
          style={{ left: `${TOP_COLS[i]}%` }}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

// Left computation, drawn as one SVG so the arrows can connect across the two
// tables: birth year + chosen year each split & reduced (the two boxes); each
// table's bottom row then flows down (the curved arrows go around table 2) and
// is added column-wise into the sums below, which merge into the final digit.
function YearCombo({ birthYear, addedYear }: { birthYear: string; addedYear: string }) {
  const b = splitYear(birthYear);
  const a = splitYear(addedYear);
  const sum1 = b && a ? reduceToSingle(b.ra + a.ra) : null;
  const sum2 = b && a ? reduceToSingle(b.rb + a.rb) : null;
  const final = sum1 != null && sum2 != null ? reduceToSingle(sum1 + sum2) : null;

  // Theme colours (match the BaseChart's tiers): soft cell fill, gold circles,
  // a deeper-gold final, and lighter lines/arrows.
  const boxStyle = { fill: "var(--chart-fill-1)", stroke: "var(--chart-line)" };
  const lineStyle = { stroke: "var(--chart-line)" };
  const discStyle = { fill: "var(--chart-fill-2)", stroke: "var(--chart-line)" };
  const finalStyle = { fill: "var(--chart-fill-3)", stroke: "var(--chart-stroke)" };
  const numStyle = { fill: "var(--chart-text)" };

  return (
    <svg
      viewBox="0 0 240 320"
      className="mx-auto w-full max-w-[208px] lg:-translate-x-[30%]"
      fill="none"
      stroke="currentColor"
      style={{ color: "var(--chart-line)" }}
    >
      <defs>
        <marker id="zeri-ah" markerWidth="9" markerHeight="9" refX="5" refY="4.5" orient="auto">
          <path
            d="M1.5 1.5 L6 4.5 L1.5 7.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>

      {/* the two tables (soft fill + centre divider + row divider) */}
      <g strokeWidth="1.5">
        <rect x="50" y="15" width="140" height="80" rx="6" style={boxStyle} />
        <line x1="120" y1="15" x2="120" y2="95" style={lineStyle} />
        <line x1="50" y1="55" x2="190" y2="55" style={lineStyle} />
        <rect x="50" y="125" width="140" height="80" rx="6" style={boxStyle} />
        <line x1="120" y1="125" x2="120" y2="205" style={lineStyle} />
        <line x1="50" y1="165" x2="190" y2="165" style={lineStyle} />
      </g>

      {/* circled reductions + final */}
      <g strokeWidth="1.5">
        <circle cx="85" cy="76" r="14" style={discStyle} />
        <circle cx="155" cy="76" r="14" style={discStyle} />
        <circle cx="85" cy="186" r="14" style={discStyle} />
        <circle cx="155" cy="186" r="14" style={discStyle} />
        <circle cx="120" cy="293" r="15" strokeWidth="2" style={finalStyle} />
      </g>

      {/* split halves, reductions, sums, final */}
      <g stroke="none" textAnchor="middle" style={numStyle}>
        <g fontSize="17" fontWeight="600">
          <text x="85" y="46">{show(b?.a)}</text>
          <text x="155" y="46">{show(b?.b)}</text>
          <text x="85" y="156">{show(a?.a)}</text>
          <text x="155" y="156">{show(a?.b)}</text>
        </g>
        <g fontSize="16" fontWeight="700">
          <text x="85" y="82">{show(b?.ra)}</text>
          <text x="155" y="82">{show(b?.rb)}</text>
          <text x="85" y="192">{show(a?.ra)}</text>
          <text x="155" y="192">{show(a?.rb)}</text>
          <text x="85" y="252">{show(sum1)}</text>
          <text x="155" y="252">{show(sum2)}</text>
          <text x="120" y="299">{show(final)}</text>
        </g>
      </g>

      {/* arrows: each table's bottom row → the sums below table 2 */}
      <g strokeWidth="1.5">
        {/* table 1 bottoms curve around table 2 */}
        <path d="M80 90 C 18 130, 18 210, 82 236" markerEnd="url(#zeri-ah)" />
        <path d="M160 90 C 222 130, 222 210, 158 236" markerEnd="url(#zeri-ah)" />
        {/* table 2 bottoms straight down */}
        <path d="M85 200 L 85 236" markerEnd="url(#zeri-ah)" />
        <path d="M155 200 L 155 236" markerEnd="url(#zeri-ah)" />
        {/* sums merge into the final */}
        <path d="M85 258 L 116 281" markerEnd="url(#zeri-ah)" />
        <path d="M155 258 L 124 281" markerEnd="url(#zeri-ah)" />
      </g>
    </svg>
  );
}

// 择日 page — input section: birth date + the year & month to select a date in.
// The year/month can't be earlier than the current year/month.
export default function ZeriPage() {
  const [birthDate, setBirthDate] = usePersistedState("life-chart-zeri-birthDate", "");
  const [year, setYear] = usePersistedState("life-chart-zeri-year", "");
  const [month, setMonth] = usePersistedState("life-chart-zeri-month", "");
  // Computed on the client only (avoids a build-time vs. runtime hydration gap).
  const [now, setNow] = useState<{ year: number; month: number } | null>(null);
  // Which diagram to show when a final number maps to more than one (final 1).
  const [variant, setVariant] = useState(0);

  useEffect(() => {
    const d = new Date();
    setNow({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }, []);

  // Final reduced number from birth year + chosen year (same chain as YearCombo),
  // then look up its reference chart and populate the diagram from the middle down.
  const fb = splitYear(birthDate.slice(0, 4));
  const fa = splitYear(year);
  const fSum1 = fb && fa ? reduceToSingle(fb.ra + fa.ra) : null;
  const fSum2 = fb && fa ? reduceToSingle(fb.rb + fa.rb) : null;
  const finalReduced =
    fSum1 != null && fSum2 != null ? reduceToSingle(fSum1 + fSum2) : null;
  // A final can have multiple diagrams (final 1); the user clicks to cycle.
  const options = finalReduced != null ? MIDDLE_BY_FINAL[finalReduced] ?? [] : [];
  const hasVariants = options.length > 1;
  const middle = options.length ? options[variant % options.length] : null;
  const rightChart = chartFromMiddle(middle);

  // The two reference lines above the diagram.
  // Bottom line (birth year, e.g. 1989 → 8 9 1 8): the last two digits, then the
  // reduced halves. Top line (择日年份, e.g. 2033 → ○ month 2 6): an empty circle,
  // the chosen 月份, then the reduced halves of the chosen year.
  const birthSplit = splitYear(birthDate.slice(0, 4));
  const chosenSplit = splitYear(year);
  const monthNum = month ? Number(month) : NaN;
  // Bottom line, first two numbers: reduced birth day and reduced birth month.
  const validBirth = /^\d{4}-\d{2}-\d{2}$/.test(birthDate);
  const rBirthDay = validBirth ? reduceToSingle(Number(birthDate.slice(8, 10))) : NaN;
  const rBirthMonth = validBirth ? reduceToSingle(Number(birthDate.slice(5, 7))) : NaN;

  // The diagram's first row = the two lines added column-wise. Column 2 adds the
  // chosen month + reduced birth month; columns 3–4 add the reduced year halves.
  // Column 1 has no addend (the circle), so it's deduced from column 2 and the
  // diagram's left-middle number.
  const col1 = reduceToSingle(monthNum + rBirthMonth);
  const col2 = birthSplit && chosenSplit ? reduceToSingle(chosenSplit.ra + birthSplit.ra) : NaN;
  const col3 = birthSplit && chosenSplit ? reduceToSingle(chosenSplit.rb + birthSplit.rb) : NaN;
  const col0 = middle ? deduceFirst(middle[0], col1) : NaN;
  const rightChartFull = { ...rightChart, reducedBirthDate: [col0, col1, col2, col3] };

  // Auspicious days: every day in the chosen month whose digit adds with the
  // reduced birth day (bottom-line col 1) to reproduce the diagram's first number
  // (col0). i.e. reduce(day + reducedBirthDay) === col0 — the date for the circle.
  const goodDays =
    !Number.isNaN(col0) && !Number.isNaN(rBirthDay) && !Number.isNaN(monthNum)
      ? Array.from({ length: daysInMonth(Number(year), monthNum) }, (_, i) => i + 1).filter(
          (d) => reduceToSingle(d + rBirthDay) === col0,
        )
      : [];

  const yearNum = Number(year);
  // Months allowed: from the current month if it's the current year, else all 12.
  const minMonth = now && yearNum === now.year ? now.month : 1;
  const months = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => m >= minMonth);

  const onYearChange = (value: string) => {
    setYear(value);
    if (now && Number(value) === now.year && month && Number(month) < now.month) {
      setMonth("");
    }
  };

  const onYearBlur = () => {
    if (now && year && Number(year) < now.year) setYear(String(now.year));
  };

  return (
    <>
      <div id="sec-zeri" className="w-full scroll-mt-24">
        <Section title="择日">
          <div className="mt-4 flex flex-col gap-4 sm:flex-row">
            <div className={fieldClass}>
              <label htmlFor="zeri-birthDate" className={labelClass}>
                出生日期
              </label>
              <input
                id="zeri-birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                suppressHydrationWarning
                className={inputClass}
              />
            </div>
            <div className={fieldClass}>
              <label htmlFor="zeri-year" className={labelClass}>
                择日年份
              </label>
              <input
                id="zeri-year"
                type="number"
                inputMode="numeric"
                min={now?.year}
                placeholder={now ? String(now.year) : "例如 2025"}
                value={year}
                onChange={(e) => onYearChange(e.target.value)}
                onBlur={onYearBlur}
                suppressHydrationWarning
                className={inputClass}
              />
            </div>
            <div className={fieldClass}>
              <label htmlFor="zeri-month" className={labelClass}>
                月份
              </label>
              <select
                id="zeri-month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                suppressHydrationWarning
                className={inputClass}
              >
                <option value="">请选择</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m} 月
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>
      </div>

      {/* Year combination: left computation, right diagram (placeholder for now). */}
      <div id="sec-zeri-combo" className="w-full scroll-mt-24">
        <Section title="择日组合">
          <div className="mt-4 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
            <div className="shrink-0 sm:w-1/3">
              <YearCombo birthYear={birthDate.slice(0, 4)} addedYear={year} />
            </div>
            <div className="flex w-full min-w-0 flex-1 flex-col items-center px-4 sm:px-12">
              <div className="@container w-[51.48rem] max-w-full sm:-translate-x-[12%]">
                {/* Two reference lines above the pyramid, column-aligned with
                    each other and with the diagram's first row. */}
                <div className="-mb-2">
                  {/* Top line: 择日年份 → empty circle, the chosen 月份 (boxed to
                      mark it as an input), reduced halves. */}
                  <RefLine
                    cells={[
                      <span
                        key="c"
                        className="inline-block aspect-square w-[4cqw] rounded-full border-[0.35cqw] border-amber-800"
                      />,
                      <span
                        key="m"
                        className="inline-flex items-center justify-center rounded border-[0.3cqw] border-amber-400 bg-amber-50/60 px-[1.6cqw] text-[3.75cqw] font-semibold text-amber-800"
                      >
                        {month ? Number(month) : "–"}
                      </span>,
                      <span key="ra" className="text-[3.75cqw] font-semibold text-amber-800">{show(chosenSplit?.ra)}</span>,
                      <span key="rb" className="text-[3.75cqw] font-semibold text-amber-800">{show(chosenSplit?.rb)}</span>,
                    ]}
                  />
                  {/* Bottom line: reduced birth day, reduced birth month, then the
                      reduced halves of the birth year. */}
                  <RefLine
                    cells={[
                      <span key="d0" className="text-[3.75cqw] font-semibold text-amber-800">{show(rBirthDay)}</span>,
                      <span key="d1" className="text-[3.75cqw] font-semibold text-amber-800">{show(rBirthMonth)}</span>,
                      <span key="ra" className="text-[3.75cqw] font-semibold text-amber-800">{show(birthSplit?.ra)}</span>,
                      <span key="rb" className="text-[3.75cqw] font-semibold text-amber-800">{show(birthSplit?.rb)}</span>,
                    ]}
                  />
                </div>
                {hasVariants ? (
                  <button
                    type="button"
                    onClick={() => setVariant((v) => v + 1)}
                    title="点击切换图表"
                    className="block w-full rounded-xl transition hover:ring-2 hover:ring-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  >
                    <BaseChart chart={rightChartFull} hideTop />
                  </button>
                ) : (
                  <BaseChart chart={rightChartFull} hideTop />
                )}
                {hasVariants && (
                  <p className="mt-2 text-center text-xs font-medium text-amber-700">
                    点击图表切换（{(variant % options.length) + 1}/{options.length}）
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Auspicious days for the chosen month, fulfilling the diagram values. */}
          {goodDays.length > 0 && (
            <p className="mt-8 text-center text-2xl font-semibold text-amber-900">
              {monthNum}月吉日是：{goodDays.map((d) => `${d}日`).join("、")}
            </p>
          )}
        </Section>
      </div>
    </>
  );
}

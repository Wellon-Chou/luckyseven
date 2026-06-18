import { type ReactNode } from "react";
import { Section } from "../Section";
import { pairToPlanet, PLANETS_ORDER } from "../../lib/planets";
import { adjacentPairs, reduceToSingle } from "../../lib/numerology";
import { digitToElement } from "../../lib/elements";

// 序号 | 组合 | 星属 table for a list of 2-digit numbers.
function PairTable({ title, rows }: { title?: string; rows: string[] }) {
  return (
    <div className="subcard rounded-xl border border-amber-100 bg-amber-50/60 p-4">
      {title && <h3 className="mb-3 text-base font-semibold text-amber-900">{title}</h3>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-amber-200 text-zinc-500">
            <th className="pb-2 text-left font-medium">序号</th>
            <th className="pb-2 text-left font-medium">组合</th>
            <th className="pb-2 text-right font-medium">星属</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((pair, i) => (
            <tr key={i} className="border-b border-amber-100/70">
              <td className="py-1.5 tabular-nums text-zinc-500">{i + 1}</td>
              <td className="py-1.5 font-mono tabular-nums text-zinc-700">{pair}</td>
              <td className="py-1.5 text-right font-medium text-amber-800">
                {pairToPlanet(pair)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr className="border-b border-amber-100/70">
              <td className="py-1.5 text-zinc-400" colSpan={3}>
                （请先输入）
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const planetCounts = (rows: string[]): Record<string, number> => {
  const counts: Record<string, number> = Object.fromEntries(PLANETS_ORDER.map((p) => [p, 0]));
  for (const num of rows) {
    const planet = pairToPlanet(num);
    if (planet) counts[planet] += 1;
  }
  return counts;
};

// 序号 | 星属 | <countLabel> tally with a 总数 bottom row.
function CountTable({
  title,
  rows,
  countLabel,
}: {
  title?: string;
  rows: string[];
  countLabel: string;
}) {
  const counts = planetCounts(rows);
  const grand = PLANETS_ORDER.reduce((sum, p) => sum + counts[p], 0);

  return (
    <div className="subcard rounded-xl border border-amber-400 bg-amber-50 p-4 ring-1 ring-amber-200">
      {title && <h3 className="mb-3 text-base font-semibold text-amber-900">{title}</h3>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-amber-200 text-zinc-500">
            <th className="pb-2 text-left font-medium">序号</th>
            <th className="pb-2 text-left font-medium">星属</th>
            <th className="pb-2 text-center font-medium">{countLabel}</th>
          </tr>
        </thead>
        <tbody>
          {PLANETS_ORDER.map((planet, i) => {
            const count = counts[planet];
            return (
              <tr key={planet} className="border-b border-amber-100/70">
                <td className="py-1.5 tabular-nums text-zinc-500">{i + 1}</td>
                <td className="py-1.5 font-medium text-amber-800">{planet}</td>
                <td
                  className={`py-1.5 text-center font-semibold tabular-nums ${
                    count === 0 ? "text-zinc-400" : "text-amber-800"
                  }`}
                >
                  {count}
                </td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-amber-200 font-semibold text-amber-900">
            <td className="py-1.5" colSpan={2}>
              总数
            </td>
            <td className="py-1.5 text-center tabular-nums">{grand}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// One 八大行星 group: optional left source display, the 序号|组合|星属 table, and
// the 序号|星属|<count> tally. With no `left`, it's a 2-column layout.
export function PlanetGroupSection({
  title,
  top,
  left,
  rows,
  countLabel,
  tableTitle,
  tallyTitle,
  footer,
  bare = false,
}: {
  title?: string;
  top?: ReactNode;
  left?: ReactNode;
  rows: string[];
  countLabel: string;
  tableTitle?: string;
  tallyTitle?: string;
  footer?: ReactNode;
  // `bare` renders the content without the Section card (for embedding inside a
  // combined section).
  bare?: boolean;
}) {
  const content = (
    <>
      {top}
      <div
        className={`grid grid-cols-1 gap-6 lg:items-start ${bare ? "" : "mt-4"} ${
          left ? "lg:grid-cols-3" : "lg:grid-cols-2"
        }`}
      >
        {left && <div className="flex flex-col">{left}</div>}
        <PairTable title={tableTitle} rows={rows} />
        <CountTable title={tallyTitle} rows={rows} countLabel={countLabel} />
      </div>
      {footer}
    </>
  );

  if (bare) return content;
  return <Section title={title}>{content}</Section>;
}

// 五行加数 diagram: phone digits along the bottom; each adjacent pair is bracketed
// (∧) up to its reduced single digit and that digit's 五行 element.
export function FiveElementAdditionDiagram({
  title,
  phone,
}: {
  title: string;
  phone: string;
}) {
  const digits = (phone ?? "").replace(/\D/g, "").split("");
  const COL = 44;
  const H = 100;
  const width = Math.max(digits.length, 1) * COL;
  const digitX = (i: number) => i * COL + COL / 2;

  const pairs = adjacentPairs(phone).map((pair, i) => {
    const reduced = reduceToSingle(Number(pair));
    return { i, reduced, element: digitToElement(reduced), x: (i + 1) * COL };
  });

  const lineStyle = { stroke: "var(--chart-line)" };
  const textStyle = { fill: "var(--chart-text)" };

  return (
    <div className="subcard mt-6 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
      <h3 className="mb-3 text-base font-semibold text-amber-900">{title}</h3>
      {digits.length < 2 ? (
        <p className="text-sm text-zinc-400">（请先输入电话号码）</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${H}`} className="mx-auto h-auto w-full max-w-xl">
          {pairs.map((p) => (
            <g key={p.i}>
              {/* ∧ bracket from the reduced digit down to the two phone digits */}
              <line x1={p.x} y1={48} x2={digitX(p.i)} y2={74} strokeWidth={1.5} style={lineStyle} />
              <line x1={p.x} y1={48} x2={digitX(p.i + 1)} y2={74} strokeWidth={1.5} style={lineStyle} />
              <text x={p.x} y={16} textAnchor="middle" fontSize="15" fontWeight="600" style={textStyle}>
                {p.element}
              </text>
              <text x={p.x} y={42} textAnchor="middle" fontSize="15" fontWeight="700" style={textStyle}>
                {p.reduced}
              </text>
            </g>
          ))}
          {digits.map((d, i) => (
            <text key={i} x={digitX(i)} y={94} textAnchor="middle" fontSize="15" fontWeight="600" style={textStyle}>
              {d}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}

// Combined totals: 序号 | 星属 | <a column per source> | 总数, with a 总数 row.
export function PlanetTotalsSection({
  title,
  tableTitle,
  sources,
  aside,
  bare = false,
}: {
  title?: string;
  tableTitle?: string;
  sources: { label: string; rows: string[] }[];
  aside?: ReactNode;
  bare?: boolean;
}) {
  const counts = sources.map((s) => planetCounts(s.rows));
  const rowTotal = (planet: string) => counts.reduce((sum, c) => sum + c[planet], 0);
  const colTotal = (i: number) => PLANETS_ORDER.reduce((sum, p) => sum + counts[i][p], 0);
  const grand = sources.reduce((sum, _, i) => sum + colTotal(i), 0);

  const content = (
    <div
      className={`grid grid-cols-1 gap-6 lg:items-start ${bare ? "" : "mt-4"} ${
        aside ? "lg:grid-cols-[2fr_1fr]" : ""
      }`}
    >
      <div className="subcard overflow-x-auto rounded-xl border border-amber-400 bg-amber-50 p-4 ring-1 ring-amber-200">
        {tableTitle && <h3 className="mb-3 text-base font-semibold text-amber-900">{tableTitle}</h3>}
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-amber-200 text-zinc-500">
              <th className="pb-2 text-left font-medium">序号</th>
              <th className="pb-2 text-left font-medium">星属</th>
              {sources.map((s) => (
                <th key={s.label} className="pb-2 text-center font-medium">
                  {s.label}
                </th>
              ))}
              <th className="pb-2 text-center font-medium">总数</th>
            </tr>
          </thead>
          <tbody>
            {PLANETS_ORDER.map((planet, idx) => {
              const total = rowTotal(planet);
              return (
                <tr key={planet} className="border-b border-amber-100/70">
                  <td className="py-1.5 tabular-nums text-zinc-500">{idx + 1}</td>
                  <td className="py-1.5 font-medium text-amber-800">{planet}</td>
                  {counts.map((c, i) => (
                    <td
                      key={i}
                      className={`py-1.5 text-center tabular-nums ${
                        c[planet] === 0 ? "text-zinc-400" : "text-zinc-700"
                      }`}
                    >
                      {c[planet]}
                    </td>
                  ))}
                  <td
                    className={`py-1.5 text-center font-semibold tabular-nums ${
                      total === 0 ? "text-zinc-400" : "text-amber-800"
                    }`}
                  >
                    {total}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-amber-200 font-semibold text-amber-900">
              <td className="py-1.5" colSpan={2}>
                总数
              </td>
              {sources.map((s, i) => (
                <td key={s.label} className="py-1.5 text-center tabular-nums">
                  {colTotal(i)}
                </td>
              ))}
              <td className="py-1.5 text-center tabular-nums">{grand}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {aside}
    </div>
  );

  if (bare) return content;
  return <Section title={title}>{content}</Section>;
}

// 五行 health table (五行 | 总数) for a chart's countHealth.
const HEALTH_ELEMENTS: { key: string; label: string }[] = [
  { key: "gold", label: "金" },
  { key: "wood", label: "木" },
  { key: "water", label: "水" },
  { key: "fire", label: "火" },
  { key: "earth", label: "土" },
];

export function FiveElementHealthTable({
  title,
  countHealth,
}: {
  title: string;
  countHealth: Record<string, number>;
}) {
  return (
    <div className="subcard rounded-xl border border-amber-100 bg-amber-50/60 p-4">
      <h3 className="mb-3 text-base font-semibold text-amber-900">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-amber-200 text-zinc-500">
            <th className="pb-2 text-left font-medium">五行</th>
            <th className="pb-2 text-center font-medium">总数</th>
          </tr>
        </thead>
        <tbody>
          {HEALTH_ELEMENTS.map((e) => {
            const count = countHealth[e.key] ?? 0;
            return (
              <tr key={e.key} className="border-b border-amber-100/70">
                <td className="py-1.5 font-medium text-amber-800">{e.label}</td>
                <td
                  className={`py-1.5 text-center font-semibold tabular-nums ${
                    count === 0 ? "text-zinc-400" : "text-amber-800"
                  }`}
                >
                  {count}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

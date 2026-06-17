import { type ReactNode } from "react";
import { Section } from "../Section";
import { pairToPlanet, PLANETS_ORDER } from "../../lib/planets";

// 数字 | 行星 table for a list of 2-digit numbers.
function PairTable({ rows }: { rows: string[] }) {
  return (
    <div className="subcard rounded-xl border border-amber-100 bg-amber-50/60 p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-amber-200 text-left text-zinc-500">
            <th className="pb-2 font-medium">数字</th>
            <th className="pb-2 text-right font-medium">行星</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((pair, i) => (
            <tr key={i} className="border-b border-amber-100/70">
              <td className="py-1.5 font-mono tabular-nums text-zinc-700">{pair}</td>
              <td className="py-1.5 text-right font-medium text-amber-800">
                {pairToPlanet(pair)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr className="border-b border-amber-100/70">
              <td className="py-1.5 text-zinc-400" colSpan={2}>
                （请先输入）
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Per-planet tally (总数) for one source's rows, plus a grand total.
function CountTable({ rows }: { rows: string[] }) {
  const counts: Record<string, number> = Object.fromEntries(PLANETS_ORDER.map((p) => [p, 0]));
  for (const num of rows) {
    const planet = pairToPlanet(num);
    if (planet) counts[planet] += 1;
  }
  const grand = PLANETS_ORDER.reduce((sum, p) => sum + counts[p], 0);

  return (
    <div className="subcard rounded-xl border border-amber-400 bg-amber-50 p-4 ring-1 ring-amber-200">
      <h3 className="mb-3 text-base font-semibold text-amber-900">总数</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-amber-200 text-left text-zinc-500">
            <th className="pb-2 font-medium">行星</th>
            <th className="pb-2 text-right font-medium">总数</th>
          </tr>
        </thead>
        <tbody>
          {PLANETS_ORDER.map((planet) => {
            const count = counts[planet];
            return (
              <tr key={planet} className="border-b border-amber-100/70">
                <td className="py-1.5 font-medium text-amber-800">{planet}</td>
                <td
                  className={`py-1.5 text-right font-semibold tabular-nums ${
                    count === 0 ? "text-zinc-400" : "text-amber-800"
                  }`}
                >
                  {count}
                </td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-amber-200 font-semibold text-amber-900">
            <td className="py-1.5">合计</td>
            <td className="py-1.5 text-right tabular-nums">{grand}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// One 八大行星 group: left source display, middle 数字|行星 table, right 总数.
export function PlanetGroupSection({
  title,
  left,
  rows,
}: {
  title: string;
  left: ReactNode;
  rows: string[];
}) {
  return (
    <Section title={title}>
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <div className="flex flex-col">{left}</div>
        <PairTable rows={rows} />
        <CountTable rows={rows} />
      </div>
    </Section>
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

// Combined totals table: a column per source plus a 总数 column (per-planet sum
// across sources), and a 合计 row (per-column totals + grand total).
export function PlanetTotalsSection({
  title,
  sources,
}: {
  title: string;
  sources: { label: string; rows: string[] }[];
}) {
  const counts = sources.map((s) => planetCounts(s.rows));
  const rowTotal = (planet: string) => counts.reduce((sum, c) => sum + c[planet], 0);
  const colTotal = (i: number) => PLANETS_ORDER.reduce((sum, p) => sum + counts[i][p], 0);
  const grand = sources.reduce((sum, _, i) => sum + colTotal(i), 0);

  return (
    <Section title={title}>
      <div className="subcard mt-4 overflow-x-auto rounded-xl border border-amber-400 bg-amber-50 p-4 ring-1 ring-amber-200">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-amber-200 text-zinc-500">
              <th className="pb-2 text-left font-medium">行星</th>
              {sources.map((s) => (
                <th key={s.label} className="pb-2 text-center font-medium">
                  {s.label}
                </th>
              ))}
              <th className="pb-2 text-center font-medium">总数</th>
            </tr>
          </thead>
          <tbody>
            {PLANETS_ORDER.map((planet) => {
              const total = rowTotal(planet);
              return (
                <tr key={planet} className="border-b border-amber-100/70">
                  <td className="py-1.5 text-left font-medium text-amber-800">{planet}</td>
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
              <td className="py-1.5 text-left">合计</td>
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
    </Section>
  );
}

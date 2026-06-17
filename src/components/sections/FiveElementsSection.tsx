import { Section, EmptyHint } from "../Section";
import { adjacentPairs, healthNumbers, reduceToSingle, type Chart } from "../../lib/numerology";
import { pairToElement, ELEMENTS_ORDER } from "../../lib/elements";

// One source table: column "数字" = a list of 2-digit numbers, column "五行" =
// the element each number maps to (reduceToSingle → digit → element).
function ElementTable({
  title,
  note,
  rows,
}: {
  title: string;
  note?: string;
  rows: string[];
}) {
  return (
    <div className="subcard rounded-xl border border-amber-100 bg-amber-50/60 p-4">
      <h3 className="mb-3 flex flex-wrap items-baseline gap-x-2 text-base font-semibold text-amber-900">
        {title}
        {note && <span className="font-mono text-sm font-normal text-amber-700">{note}</span>}
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-amber-200 text-left text-zinc-500">
            <th className="pb-2 font-medium">数字</th>
            <th className="pb-2 text-right font-medium">五行</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((num, i) => (
            <tr key={i} className="border-b border-amber-100/70">
              <td className="py-1.5 font-mono tabular-nums text-zinc-700">{num}</td>
              <td className="py-1.5 text-right font-medium text-amber-800">
                {pairToElement(num)}
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

// Right-hand table: how many times each of the five elements appears across both
// source tables, plus a grand total.
function ElementCountTable({ counts }: { counts: Record<string, number> }) {
  const grand = ELEMENTS_ORDER.reduce((sum, e) => sum + (counts[e] ?? 0), 0);
  return (
    <div className="subcard rounded-xl border border-amber-400 bg-amber-50 p-4 ring-1 ring-amber-200">
      <h3 className="mb-3 text-base font-semibold text-amber-900">总数</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-amber-200 text-left text-zinc-500">
            <th className="pb-2 font-medium">五行</th>
            <th className="pb-2 text-right font-medium">总数</th>
          </tr>
        </thead>
        <tbody>
          {ELEMENTS_ORDER.map((element) => {
            const count = counts[element] ?? 0;
            return (
              <tr key={element} className="border-b border-amber-100/70">
                <td className="py-1.5 font-medium text-amber-800">{element}</td>
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

export function FiveElementsSection({
  birthDate,
  phone,
  chart,
}: {
  birthDate: string;
  phone: string;
  chart: Chart;
}) {
  // Two source tables:
  //   • 健康     → the numbers from the 健康关系 section.
  //   • 电话号码 → each adjacent digit pair of the phone, reduced to a single
  //               digit (the "added" number) via reduceToSingle.
  const phoneRows = adjacentPairs(phone).map((p) => String(reduceToSingle(Number(p))));
  const sources = [
    { title: "健康", rows: healthNumbers(chart), note: undefined as string | undefined },
    { title: "电话号码", rows: phoneRows, note: phone.trim() || undefined },
  ];

  // Tally every number's element across both source tables.
  const elementCounts: Record<string, number> = Object.fromEntries(
    ELEMENTS_ORDER.map((e) => [e, 0]),
  );
  for (const s of sources) {
    for (const num of s.rows) elementCounts[pairToElement(num)] += 1;
  }

  return (
    <Section title="五行">
      {birthDate ? (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {/* Left column: two stacked source tables. */}
          <div className="space-y-6">
            {sources.map((s) => (
              <ElementTable key={s.title} title={s.title} note={s.note} rows={s.rows} />
            ))}
          </div>

          {/* Right column: element tally, sticky-centred until the section ends. */}
          <div className="self-start lg:sticky lg:top-[calc(50vh-7rem)] print:static">
            <ElementCountTable counts={elementCounts} />
          </div>
        </div>
      ) : (
        <EmptyHint />
      )}
    </Section>
  );
}

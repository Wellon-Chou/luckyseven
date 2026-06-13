import { Section, EmptyHint } from "../Section";
import { type Chart } from "../../lib/numerology";
import { CAREER_RANKS, ELEMENT_META, getCareerPlan } from "../../lib/content";

export function CareerSection({ birthDate, chart }: { birthDate: string; chart: Chart }) {
  const { careerElement } = chart;
  return (
    <Section title="事业和职业选择">
      {birthDate ? (
        <ol className="mt-4 space-y-4">
          {getCareerPlan(careerElement).map(({ element, line }, index) => {
            const meta = ELEMENT_META[element];
            const isTop = index === 0;
            return (
              <li
                key={element}
                className={`rounded-xl border p-4 transition sm:p-5 ${
                  isTop
                    ? "border-amber-400 bg-amber-50 ring-1 ring-amber-200"
                    : "border-amber-100 bg-amber-50/40 hover:bg-amber-50"
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                    style={{ backgroundColor: meta.color }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-base font-semibold text-amber-900">
                    {CAREER_RANKS[index]}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
                  >
                    {meta.label}行
                  </span>
                  {isTop && (
                    <span className="ml-auto rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-white">
                      ★ 最推荐
                    </span>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-zinc-700">
                  {line}
                </p>
              </li>
            );
          })}
        </ol>
      ) : (
        <EmptyHint />
      )}
    </Section>
  );
}

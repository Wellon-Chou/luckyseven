import { Section, EmptyHint } from "../Section";
import { BoxHeader } from "../BoxHeader";
import { show, type Chart } from "../../lib/numerology";
import { getRootLine, getStoryLine, getStoryTitles } from "../../lib/content";

const cardClass =
  "rounded-xl border border-amber-100 bg-amber-50/60 p-4 transition hover:border-amber-300 hover:bg-amber-50 hover:shadow-sm";
const bodyClass = "mt-2 whitespace-pre-line leading-relaxed text-zinc-700";

export function StorySection({ birthDate, chart }: { birthDate: string; chart: Chart }) {
  const { rootNumber, uniqueStoryNumbers } = chart;
  return (
    <Section title="数字故事">
      {birthDate ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div key={rootNumber} className={cardClass}>
            <BoxHeader badge={show(rootNumber)} title="根数 — 主性格" titleColor="#ff1100" />
            <p className={bodyClass}>
              {getRootLine(rootNumber)}
            </p>
          </div>
          {uniqueStoryNumbers.map((num) => (
            <div key={num} className={cardClass}>
              <BoxHeader badge={num} title={getStoryTitles(num)} titleColor={Number(num) < 10 ? "#ff1100" : "#a34d2b"} />
              <p className={bodyClass}>
                {getStoryLine(num)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyHint />
      )}
    </Section>
  );
}

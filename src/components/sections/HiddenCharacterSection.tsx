import { Section, EmptyHint } from "../Section";
import { BoxHeader } from "../BoxHeader";
import { type Chart } from "../../lib/numerology";
import { getCharacteristicsLine } from "../../lib/content";

const cardClass =
  "rounded-xl border border-amber-100 bg-amber-50/60 p-4 transition hover:border-amber-300 hover:bg-amber-50 hover:shadow-sm";
const bodyClass = "mt-2 whitespace-pre-line leading-relaxed text-zinc-700";
const fallback = "No story line available for this number.";

// Each hidden-character card: which hiddenNumbers slot, its lines.json key, and its label.
const SLOTS: { key: string; lineKey: string; title: string; index: number }[] = [
  { key: "characteristic-hidden", lineKey: "hidden", title: "隐藏性格", index: 0 },
  { key: "characteristic-parent-1", lineKey: "parent", title: "与父亲关系", index: 1 },
  { key: "characteristic-parent-2", lineKey: "parent", title: "与母亲关系", index: 2 },
  { key: "characteristic-impression", lineKey: "impression", title: "外表给人的感觉", index: 3 },
  { key: "characteristic-subconscious", lineKey: "subconscious", title: "潜意识性格", index: 4 },
];

export function HiddenCharacterSection({ birthDate, chart }: { birthDate: string; chart: Chart }) {
  const { hiddenNumbers } = chart;
  return (
    <Section title="隐藏性格">
      {birthDate ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SLOTS.map((slot) => (
            <div key={slot.key} className={cardClass}>
              <BoxHeader badge={hiddenNumbers[slot.index]} title={slot.title} />
              <p className={bodyClass}>
                {getCharacteristicsLine(slot.lineKey, hiddenNumbers[slot.index]) || fallback}
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

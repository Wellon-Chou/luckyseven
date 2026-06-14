import { Section, EmptyHint } from "../Section";
import { BoxHeader } from "../BoxHeader";
import { DirectionCompass } from "../DirectionCompass";
import { type Chart } from "../../lib/numerology";

export function DirectionsSection({ birthDate, chart }: { birthDate: string; chart: Chart }) {
  const { countDirections, directionValues } = chart;
  const cards = [
    { label: "财富方向", number: 6, color: "#d97706", data: countDirections.wealth },
    { label: "幸运方向", number: 7, color: "#16a34a", data: countDirections.luck },
    { label: "成功方向", number: 9, color: "#2563eb", data: countDirections.success },
  ];
  return (
    <Section title="最好方向">
      {birthDate ? (
        <div className="mt-4 flex flex-col gap-6 lg:flex-row print:flex-row">
          <div className="flex justify-center lg:w-1/3 lg:shrink-0 lg:justify-start print:w-1/3 print:shrink-0 print:justify-start">
            <DirectionCompass values={directionValues} />
          </div>
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            {cards.map(({ label, number, color, data }) => (
              <div
                key={label}
                className="rounded-xl border border-l-4 border-amber-100 bg-amber-50/60 p-4 transition hover:bg-amber-50 hover:shadow-sm"
                style={{ borderLeftColor: color }}
              >
                <BoxHeader badge={number} title={label} accentColor={color} />
                <p className="mt-2 leading-relaxed text-zinc-500">
                  数量：{data.count}
                  {data.count > 0 && (
                    <>
                      ｜方向：
                      <span className="font-semibold" style={{ color }}>
                        {data.directions.join("、")}
                      </span>
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyHint />
      )}
    </Section>
  );
}

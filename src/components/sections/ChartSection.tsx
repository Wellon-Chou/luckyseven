import { Section } from "../Section";
import { BaseChart } from "../BaseChart";
import { type Chart } from "../../lib/numerology";

export function ChartSection({ chart }: { chart: Chart }) {
  return (
    <Section title="个人图表">
      <div className="mt-16 mb-8 flex justify-center print:mt-4 print:mb-2">
        <div className="@container w-full max-w-2xl print:max-w-xs">
          <BaseChart chart={chart} />
        </div>
      </div>
    </Section>
  );
}

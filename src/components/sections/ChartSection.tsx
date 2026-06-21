'use client';

import { useState } from "react";
import { Section } from "../Section";
import { BaseChart } from "../BaseChart";
import { ChartModeToggle, type ChartMode } from "../ChartModeToggle";
import { shadowChart, type Chart } from "../../lib/numerology";

export function ChartSection({ chart }: { chart: Chart }) {
  const [mode, setMode] = useState<ChartMode>("normal");
  const shown = mode === "shadow" ? shadowChart(chart) : chart;

  return (
    <Section title="个人蓝图">
      <div className="mt-16 mb-8 flex justify-center print:mt-4 print:mb-2">
        <div
          className={`@container w-full max-w-2xl print:max-w-xs ${
            mode === "shadow" ? "chart-shadow" : ""
          }`}
        >
          <BaseChart chart={shown} />
        </div>
      </div>
      <div className="flex justify-end">
        <ChartModeToggle mode={mode} onChange={setMode} />
      </div>
    </Section>
  );
}

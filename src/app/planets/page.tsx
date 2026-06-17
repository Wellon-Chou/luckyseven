'use client';

import { useInput } from "../../components/InputProvider";
import { InputSection } from "../../components/sections/InputSection";
import { PlanetGroupSection, PlanetTotalsSection } from "../../components/sections/PlanetsSection";
import { FiveElementsSection } from "../../components/sections/FiveElementsSection";
import { BaseChart } from "../../components/BaseChart";
import { adjacentPairs, blueprintNumbers, icToNumber } from "../../lib/numerology";

// Small left-hand "source" card for the IC / phone groups.
function SourceCard({
  rows,
}: {
  rows: { label: string; value: string; strong?: boolean }[];
}) {
  return (
    <div className="subcard rounded-xl border border-amber-100 bg-amber-50/60 p-4">
      {rows.map((r) => (
        <div key={r.label} className="mb-3 last:mb-0">
          <p className="text-xs text-zinc-500">{r.label}</p>
          <p
            className={`font-mono text-base break-all ${
              r.strong ? "font-semibold text-amber-800" : "text-zinc-800"
            }`}
          >
            {r.value || "–"}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function PlanetsPage() {
  const { name, setName, birthDate, setBirthDate, phone, setPhone, ic, setIc, chart } =
    useInput();
  const icNumber = icToNumber(ic);

  return (
    <>
      <div id="sec-input" className="w-full scroll-mt-24">
        <InputSection
          name={name}
          onNameChange={setName}
          birthDate={birthDate}
          onBirthDateChange={setBirthDate}
          phone={phone}
          onPhoneChange={setPhone}
          ic={ic}
          onIcChange={setIc}
        />
      </div>

      <div id="sec-planets-life" className="w-full scroll-mt-24">
        <PlanetGroupSection
          title="人生蓝图八大行星"
          left={
            <div className="@container w-full">
              <BaseChart chart={chart} />
            </div>
          }
          rows={blueprintNumbers(chart)}
        />
      </div>

      <div id="sec-planets-ic" className="w-full scroll-mt-24">
        <PlanetGroupSection
          title="身份证八大行星"
          left={
            <SourceCard
              rows={[
                { label: "身份证号码", value: ic },
                { label: "转换后", value: icNumber, strong: true },
              ]}
            />
          }
          rows={adjacentPairs(icNumber)}
        />
      </div>

      <div id="sec-planets-phone" className="w-full scroll-mt-24">
        <PlanetGroupSection
          title="电话号码八大行星"
          left={<SourceCard rows={[{ label: "电话号码", value: phone, strong: true }]} />}
          rows={adjacentPairs(phone)}
        />
      </div>

      <div id="sec-planets-total" className="w-full scroll-mt-24">
        <PlanetTotalsSection
          title="总数八大行星"
          sources={[
            { label: "人生蓝图", rows: blueprintNumbers(chart) },
            { label: "身份证", rows: adjacentPairs(icNumber) },
            { label: "电话号码", rows: adjacentPairs(phone) },
          ]}
        />
      </div>

      <div id="sec-elements" className="w-full scroll-mt-24">
        <FiveElementsSection birthDate={birthDate} phone={phone} chart={chart} />
      </div>
    </>
  );
}

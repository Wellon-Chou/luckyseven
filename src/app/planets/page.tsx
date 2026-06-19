'use client';

import { useInput } from "../../components/InputProvider";
import { InputSection } from "../../components/sections/InputSection";
import {
  PlanetGroupSection,
  PlanetTotalsSection,
  FiveElementHealthTable,
  FiveElementAdditionDiagram,
} from "../../components/sections/PlanetsSection";
import { BaseChart } from "../../components/BaseChart";
import { adjacentPairs, blueprintNumbers, icToNumber } from "../../lib/numerology";

// Small left-hand "source" card for the diagram / IC groups.
function SourceCard({
  title,
  rows,
}: {
  title?: string;
  rows: { label: string; value: string; strong?: boolean }[];
}) {
  return (
    <div className="subcard rounded-xl border border-amber-100 bg-amber-50/60 p-4">
      {title && <h3 className="mb-3 text-base font-semibold text-amber-900">{title}</h3>}
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
  const {
    name,
    setName,
    birthDatePhoneNumber,
    setbirthDatePhoneNumber,
    phone,
    setPhone,
    ic,
    setIc,
    phoneNumberChart,
    personalChart,
  } = useInput();

  const birthDate = birthDatePhoneNumber;
  const setBirthDate = setbirthDatePhoneNumber;
  const chart = phoneNumberChart;
  const icNumber = icToNumber(ic);

  return (
    <>
      {/* 1 — input (DOB + IC) */}
      <div id="sec-input" className="w-full scroll-mt-24">
        <InputSection
          fields={["name", "birthDate", "ic"]}
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

      {/* 2 — 人生蓝图: diagram | table | tally */}
      <div id="sec-planets-life" className="w-full scroll-mt-24">
        <PlanetGroupSection
          title="人生蓝图"
          tableTitle="人生蓝图八大行星"
          tallyTitle="人生蓝图星属统计"
          left={
            <div className="@container w-full">
              <BaseChart chart={chart} />
            </div>
          }
          rows={blueprintNumbers(chart)}
          countLabel="蓝图"
        />
      </div>

      {/* 3 — 身份证: IC | table | tally */}
      <div id="sec-planets-ic" className="w-full scroll-mt-24">
        <PlanetGroupSection
          title="身份证号码"
          tableTitle="身份证八大行星"
          tallyTitle="身份证星属统计"
          left={
            <SourceCard
              rows={[
                { label: "身份证号码", value: ic },
                { label: "转换后", value: icNumber, strong: true },
              ]}
            />
          }
          rows={adjacentPairs(icNumber)}
          countLabel="身份证"
        />
      </div>

      {/* 4 — 总数 (蓝图 + 身份证) */}
      <div id="sec-planets-total" className="w-full scroll-mt-24">
        <PlanetTotalsSection
          title="人生蓝图 + 身份证八大行星总数"
          sources={[
            { label: "人生蓝图", rows: blueprintNumbers(chart) },
            { label: "身份证", rows: adjacentPairs(icNumber) },
          ]}
          aside={
            <FiveElementHealthTable
              title="人生蓝图五行健康"
              countHealth={chart.countHealth}
            />
          }
        />
      </div>

      {/* 5 — 电话号码: phone input + table | tally + 五行加数 */}
      <div id="sec-planets-phone" className="w-full scroll-mt-24">
        <PlanetGroupSection
          title="电话号码八大行星"
          top={
            <InputSection
              bare
              fields={["phone"]}
              labels={{ phone: "输入电话号码" }}
              name={name}
              onNameChange={setName}
              birthDate={birthDate}
              onBirthDateChange={setBirthDate}
              phone={phone}
              onPhoneChange={setPhone}
              ic={ic}
              onIcChange={setIc}
            />
          }
          rows={adjacentPairs(phone)}
          countLabel="电话号码"
          footer={<FiveElementAdditionDiagram title="五行加数" phone={phone} />}
        />
      </div>
    </>
  );
}

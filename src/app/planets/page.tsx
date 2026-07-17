'use client';

import { useState } from "react";
import { useInput } from "../../components/InputProvider";
import { useAuth } from "../../components/AuthProvider";
import { usePhoneArchives } from "../../components/PhoneArchivesProvider";
import { saveReportPdf } from "../../lib/savePdf";
import { PageGate } from "../../components/PageGate";
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
    namePhoneNumber,
    setNamePhoneNumber,
    birthDatePhoneNumber,
    setbirthDatePhoneNumber,
    phone,
    setPhone,
    ic,
    setIc,
    phoneNumberChart,
    personalChart,
  } = useInput();

  const name = namePhoneNumber;
  const setName = setNamePhoneNumber;
  const birthDate = birthDatePhoneNumber;
  const setBirthDate = setbirthDatePhoneNumber;
  const chart = phoneNumberChart;
  const icNumber = icToNumber(ic);

  const { user, openModal } = useAuth();
  const { save, update, records, folders } = usePhoneArchives();
  const [saving, setSaving] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordNotice, setRecordNotice] = useState<string | null>(null);
  const [saveFolderId, setSaveFolderId] = useState<string>("");

  // Match a saved record by name. Same 出生日期 + 身份证号码 → already saved
  // (disabled); either differs → offer to update it ("更新"); no match → save new.
  const trimmedName = name.trim();
  const match = trimmedName ? records.find((r) => r.name.trim() === trimmedName) : undefined;
  const alreadySaved = !!match && match.birth_date === birthDate && match.ic === ic;
  const canUpdate = !!match && !alreadySaved;
  const missingFields = !name.trim() || !birthDate || !ic.trim();
  // Hint under the button: login → birth date → name → IC. (The tier is already
  // handled by PageGate, which won't render this page below tier 2.)
  const inputHint = !user
    ? "请先登录以使用此功能"
    : !birthDate
      ? "请先输入出生日期"
      : !name.trim()
        ? "请先输入姓名"
        : !ic.trim()
          ? "请先输入身份证号码"
          : null;

  // Export the whole page as a PDF. Unlike 个人蓝图 there's no AI summary to
  // generate first, so this just captures what's on screen.
  const handleSavePdf = async () => {
    const el = document.querySelector("main");
    if (!el) return;
    setSaving(true);
    try {
      const safe = (name || "命盘").replace(/[\\/:*?"<>|]/g, "").trim();
      await saveReportPdf(el as HTMLElement, `${safe}-电话号码.pdf`);
    } catch (e) {
      console.error(e);
      alert("保存失败，请重试。");
    } finally {
      setSaving(false);
    }
  };

  // Save the current name + 出生日期 + 身份证号码 to 电话号码存档.
  const handleSaveRecord = async () => {
    if (!user) {
      openModal();
      return;
    }
    setSavingRecord(true);
    setRecordNotice(null);
    const folderId = saveFolderId || null;
    const { error } = match
      ? await update(match.id, birthDate, ic, folderId)
      : await save(name, birthDate, ic, folderId);
    setSavingRecord(false);
    // On success the button disables itself (name now in the list); only surface
    // errors.
    setRecordNotice(error ? `保存失败：${error}` : null);
  };

  return (
    <PageGate minLevel={2}>
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

      {/* 3 — 身份证: IC | table | tally. Starts PDF page 2. */}
      <div id="sec-planets-ic" data-pdf-break-before className="w-full scroll-mt-24">
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

      {/* 5 — 电话号码: phone input + table | tally + 五行加数. Starts PDF page 3. */}
      <div id="sec-planets-phone" data-pdf-break-before className="w-full scroll-mt-24">
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
          ages={["1 - 10", "10 - 18", "18 - 26", "26 - 34", "34 - 42", "42 - 50", "50 - 70"]}
          countLabel="电话号码"
          footer={<FiveElementAdditionDiagram title="五行加数" phone={phone} />}
        />
      </div>

      {/* Export as PDF + save 姓名 + 出生日期 + 身份证号码 to 电话号码存档. */}
      <div className="flex flex-col items-center gap-3 pt-2 print:hidden">
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={handleSavePdf}
            disabled={!user || !name || !birthDate || saving}
            title={
              !user
                ? "请先登录"
                : !name || !birthDate
                  ? "请先输入姓名和出生日期"
                  : undefined
            }
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-amber-500"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
            {saving ? "保存中…" : "保存为 PDF"}
          </button>
          <button
            type="button"
            onClick={handleSaveRecord}
            disabled={!user || missingFields || savingRecord || alreadySaved}
            title={
              !user
                ? "请先登录"
                : alreadySaved
                  ? "该姓名已存档"
                  : canUpdate
                    ? "更新此姓名的出生日期与身份证号码"
                    : missingFields
                      ? "请先输入姓名、出生日期和身份证号码"
                      : undefined
            }
            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-6 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {savingRecord ? "保存中…" : alreadySaved ? "已存档" : canUpdate ? "更新" : "保存记录"}
          </button>
        </div>
        {user && folders.length > 0 && (
          <label className="inline-flex items-center gap-2 text-sm text-amber-700">
            <span>保存到文件夹</span>
            <select
              value={saveFolderId}
              onChange={(e) => setSaveFolderId(e.target.value)}
              className="rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm text-amber-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <option value="">未分类</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {inputHint && (
        <p className="pt-2 text-center text-xs font-medium text-red-600 print:hidden">
          {inputHint}
        </p>
      )}
      {recordNotice && (
        <p className="pt-2 text-center text-sm font-medium text-amber-700 print:hidden">
          {recordNotice}
        </p>
      )}
    </PageGate>
  );
}

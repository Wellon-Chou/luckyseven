'use client';

import { useRef, useState } from "react";
import { useInput } from "../components/InputProvider";
import { useAuth } from "../components/AuthProvider";
import { useAccessLevel } from "../components/AccessProvider";
import { useBlueprints } from "../components/BlueprintsProvider";
import { saveReportPdf } from "../lib/savePdf";
import { InputSection } from "../components/sections/InputSection";
import { ChartSection } from "../components/sections/ChartSection";
import { AiSummarySection, type AiSummaryHandle } from "../components/sections/AiSummarySection";
import { StorySection } from "../components/sections/StorySection";
import { HiddenCharacterSection } from "../components/sections/HiddenCharacterSection";
import { AbilitySection } from "../components/sections/AbilitySection";
import { HealthSection } from "../components/sections/HealthSection";
import { CareerSection } from "../components/sections/CareerSection";
import { DirectionsSection } from "../components/sections/DirectionsSection";

// Main page — 个人蓝图. Uses its own birth date (birthDatePersonalDiagram) and
// chart (personalChart), independent from the 八大行星 page.
export default function Home() {
  const {
    namePersonalDiagram,
    setNamePersonalDiagram,
    birthDatePersonalDiagram,
    setbirthDatePersonalDiagram,
    phone,
    setPhone,
    ic,
    setIc,
    personalChart,
  } = useInput();

  const birthDate = birthDatePersonalDiagram;
  const name = namePersonalDiagram;
  const chart = personalChart;
  const { user, openModal } = useAuth();
  const { level, loading: levelLoading } = useAccessLevel();
  // The save buttons need a paid plan (tier ≥ 1). Treat "still loading" as
  // unlocked so paying users don't see a flash of disabled buttons.
  const tierLocked = !levelLoading && level < 1;
  const { save, update, records, folders } = useBlueprints();
  const [saving, setSaving] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordNotice, setRecordNotice] = useState<string | null>(null);
  const [saveFolderId, setSaveFolderId] = useState<string>("");
  // Match a saved record by name. Same birth date → already saved (disabled);
  // different birth date → offer to update it ("更新"); no match → save new.
  const trimmedName = name.trim();
  const match = trimmedName ? records.find((r) => r.name.trim() === trimmedName) : undefined;
  const alreadySaved = !!match && match.birth_date === birthDate;
  const canUpdate = !!match && match.birth_date !== birthDate;
  // Hint under the buttons: login → subscription → birth date → name.
  const inputHint = !user
    ? "请先登录以使用此功能"
    : tierLocked
      ? "请订阅以使用此功能"
      : !birthDate
        ? "请先输入出生日期"
        : !name.trim()
          ? "请先输入姓名"
          : null;
  const summaryRef = useRef<AiSummaryHandle>(null);

  const handleSavePdf = async () => {
    const el = document.querySelector("main");
    if (!el) return;
    setSaving(true);
    try {
      // Generate the AI summary first if it hasn't been generated yet, then let
      // it paint before capturing.
      await summaryRef.current?.ensureGenerated();
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      );
      const safe = (name || "命盘").replace(/[\\/:*?"<>|]/g, "").trim();
      await saveReportPdf(el as HTMLElement, `${safe}-人生蓝图.pdf`);
    } catch (e) {
      console.error(e);
      alert("保存失败，请重试。");
    } finally {
      setSaving(false);
    }
  };

  // Save the current name + birth date to 蓝图存档 (tagged to the account).
  const handleSaveRecord = async () => {
    if (!user) {
      openModal();
      return;
    }
    setSavingRecord(true);
    setRecordNotice(null);
    // Update the existing record's birth date if the name already exists,
    // otherwise save a new record.
    const folderId = saveFolderId || null;
    const { error } = match
      ? await update(match.id, birthDate, folderId)
      : await save(name, birthDate, folderId);
    setSavingRecord(false);
    // On success the button disables itself (name now in the list); only surface
    // errors.
    setRecordNotice(error ? `保存失败：${error}` : null);
  };

  return (
    <>
      <div id="sec-input" className="w-full scroll-mt-24">
        <InputSection
          fields={["name", "birthDate"]}
          name={name}
          onNameChange={setNamePersonalDiagram}
          birthDate={birthDatePersonalDiagram}
          onBirthDateChange={setbirthDatePersonalDiagram}
          phone={phone}
          onPhoneChange={setPhone}
          ic={ic}
          onIcChange={setIc}
        />
      </div>
      <div id="sec-chart" className="w-full scroll-mt-24">
        <ChartSection chart={chart} />
      </div>
      <div id="sec-summary" className="w-full scroll-mt-24">
        <AiSummarySection ref={summaryRef} birthDate={birthDate} chart={chart} />
      </div>
      <div id="sec-story" className="w-full scroll-mt-24">
        <StorySection birthDate={birthDate} chart={chart} />
      </div>
      <div id="sec-hidden" className="w-full scroll-mt-24">
        <HiddenCharacterSection birthDate={birthDate} chart={chart} />
      </div>
      <div id="sec-ability" className="w-full scroll-mt-24">
        <AbilitySection birthDate={birthDate} chart={chart} />
      </div>
      <div id="sec-health" className="w-full scroll-mt-24">
        <HealthSection birthDate={birthDate} chart={chart} />
      </div>
      <div id="sec-career" className="w-full scroll-mt-24">
        <CareerSection birthDate={birthDate} chart={chart} />
      </div>
      <div id="sec-directions" className="w-full scroll-mt-24">
        <DirectionsSection birthDate={birthDate} chart={chart} />
      </div>

      {/* Save the report as a PDF via the browser print dialog (the print CSS in
          globals.css lays the page out cleanly for export). */}
      <div className="flex flex-col items-center gap-3 pt-2 print:hidden">
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={handleSavePdf}
            disabled={!user || tierLocked || !name || !birthDate || saving}
            title={
              !user
                ? "请先登录"
                : tierLocked
                  ? "请订阅以使用此功能"
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
            disabled={!user || tierLocked || !name || !birthDate || savingRecord || alreadySaved}
            title={
              !user
                ? "请先登录"
                : tierLocked
                  ? "请订阅以使用此功能"
                  : alreadySaved
                    ? "该姓名已存档"
                    : canUpdate
                      ? "更新此姓名的出生日期"
                      : !name || !birthDate
                        ? "请先输入姓名和出生日期"
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
        {user && !tierLocked && folders.length > 0 && (
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
    </>
  );
}

'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Section, EmptyHint } from "../Section";
import { type Chart } from "../../lib/numerology";
import { supabase } from "../../lib/supabase";

const cardClass = "subcard rounded-xl border border-amber-100 bg-amber-50/60 p-5";
const bodyClass = "whitespace-pre-line leading-relaxed text-zinc-700";
const btnClass =
  "rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60";

// Client-side cache so a previously generated story for the same chart shows
// instantly and for free on repeat clicks (the server caches too — this just
// avoids the round-trip). Entries "decay" after CACHE_TTL_MS: a click after that
// regenerates a fresh story. The cache only exists to stop rapid repeat clicks.
const CACHE_KEY = "life-summary-cache";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
type CacheEntry = { text: string; ts: number };
type CacheMap = Record<string, CacheEntry>;
function loadCache(): CacheMap {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}") as CacheMap;
  } catch {
    return {};
  }
}
function saveCache(map: CacheMap) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {
    /* ignore unavailable storage */
  }
}
// A stable key from the chart fields that determine the summary. The version
// prefix is bumped alongside the server's PROMPT_VERSION so a prompt/length
// change invalidates old cached summaries instead of showing the previous text.
function chartKey(chart: Chart): string {
  return JSON.stringify([
    "v4",
    chart.rootNumber,
    chart.storyNumbers,
    chart.uniqueStoryNumbers,
    chart.hiddenNumbers,
    chart.countMajorMinor,
    chart.countHealth,
    chart.careerElement,
  ]);
}

// Imperative handle so the PDF save can generate the story on demand if it
// hasn't been generated yet.
export type AiSummaryHandle = { ensureGenerated: () => Promise<void> };

export const AiSummarySection = forwardRef<AiSummaryHandle, { birthDate: string; chart: Chart }>(
  function AiSummarySection({ birthDate, chart }, ref) {
  const [story, setStory] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Synchronous guard against spam: blocks a second request before `busy` (state)
  // has re-rendered to disable the button, so rapid clicks can't double-bill.
  const inFlight = useRef(false);

  // A previously generated story belongs to the old birth date — clear it (and
  // any error) whenever the date changes, so it can't be mistaken for the new one.
  useEffect(() => {
    setStory(null);
    setError(null);
  }, [birthDate]);

  const generate = async () => {
    if (!supabase) {
      setError("AI 服务尚未配置。");
      return;
    }
    const key = chartKey(chart);
    // Serve the cached summary while it's still fresh — rapid repeat clicks never
    // regenerate or cost tokens. Older than the TTL → fall through and regenerate
    // a new one to replace it.
    const entry = loadCache()[key];
    if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
      setStory(entry.text);
      setError(null);
      return;
    }
    if (inFlight.current) return; // a generation is already running — ignore spam clicks
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      // Send only the chart (the computed numbers); the Edge Function reads the
      // source lines with the service role and caches the result. Free — no
      // login/quota.
      const { data, error: fnError } = await supabase.functions.invoke<{ text: string }>(
        "life-summary",
        { body: { chart } },
      );
      if (fnError) throw fnError;
      const text = data?.text ?? "";
      setStory(text);
      if (text) {
        const map = loadCache();
        map[key] = { text, ts: Date.now() };
        saveCache(map);
      }
    } catch (e) {
      // supabase-js reports non-2xx responses as a generic message and tucks the
      // function's real JSON body into error.context (a Response). Surface it.
      let msg = e instanceof Error ? e.message : "生成失败，请稍后再试。";
      const ctx = (e as { context?: Response })?.context;
      if (ctx && typeof ctx.json === "function") {
        try {
          const body = await ctx.json();
          if (body?.error) msg = body.error;
        } catch {
          /* body wasn't JSON — keep the generic message */
        }
      }
      setError(msg);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  // Generate only on demand (e.g. when saving the PDF) if there's a birth date
  // and no story yet. No deps array → the handle always reads current values.
  useImperativeHandle(ref, () => ({
    ensureGenerated: async () => {
      if (!birthDate || story != null || busy) return;
      await generate();
    },
  }));

  return (
    <Section title="总体故事">
      {birthDate ? (
        <div className="mt-4 flex flex-col gap-4">
          {story ? (
            <div className={cardClass}>
              <p className={bodyClass}>{story}</p>
              {/* Within 30 min this re-shows the cached story (anti-spam); after
                  that a click regenerates a fresh one. */}
              <button type="button" onClick={() => generate()} disabled={busy} className={`mt-4 ${btnClass} print:hidden`}>
                {busy ? "生成中…" : "重新生成"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="leading-relaxed text-zinc-500">
                综合「数字故事 · 隐藏性格 · 能力分布 · 健康关系 · 事业和职业选择」，
                生成一段专属于您的人生故事。
              </p>
              <button type="button" onClick={() => generate()} disabled={busy} className={`${btnClass} print:hidden`}>
                {busy ? "生成中…" : "生成总体故事"}
              </button>
            </div>
          )}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </div>
      ) : (
        <EmptyHint />
      )}
    </Section>
  );
});

'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Section, EmptyHint } from "../Section";
import { type Chart } from "../../lib/numerology";
import { supabase, supabaseUrl, supabaseAnonKey } from "../../lib/supabase";

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
// After a forced 重新生成, the button is locked for this long.
const REGEN_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const REGEN_KEY = "life-summary-regen-at";
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

  // Regenerate cooldown: `regenAt` (persisted) is when the last forced 重新生成
  // happened; once set, the button locks until REGEN_COOLDOWN_MS later.
  const [regenAt, setRegenAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  // The cooldown warning only appears after the user clicks while locked.
  const [showLockMsg, setShowLockMsg] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem(REGEN_KEY);
    setRegenAt(raw ? Number(raw) : null);
    setNow(Date.now());
  }, []);
  const regenLocked = regenAt != null && now - regenAt < REGEN_COOLDOWN_MS;
  // Re-enable the button when the cooldown expires.
  useEffect(() => {
    if (regenAt == null) return;
    const remaining = regenAt + REGEN_COOLDOWN_MS - Date.now();
    if (remaining <= 0) return;
    const id = setTimeout(() => setNow(Date.now()), remaining);
    return () => clearTimeout(id);
  }, [regenAt]);

  // A previously generated story belongs to the old birth date — clear it (and
  // any error) whenever the date changes, so it can't be mistaken for the new one.
  useEffect(() => {
    setStory(null);
    setError(null);
    setShowLockMsg(false);
  }, [birthDate]);

  // `force` skips the cache to make a fresh summary (重新生成). Returns true if a
  // story was produced (cache hit or fresh), false on error.
  const generate = async (force = false): Promise<boolean> => {
    if (!supabase || !supabaseUrl || !supabaseAnonKey) {
      setError("AI 服务尚未配置。");
      return false;
    }
    const key = chartKey(chart);
    if (!force) {
      // Serve the fresh cached summary — repeat clicks never regenerate or cost.
      const entry = loadCache()[key];
      if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
        setStory(entry.text);
        setError(null);
        return true;
      }
    }
    if (inFlight.current) return false; // a generation is already running
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      // Call the function with a raw fetch so we can read the *streamed* response and
      // render the story as it's written (supabase-js's invoke() buffers the whole
      // body). Retry ONLY the initial connection — once the stream starts we never
      // retry, so a mid-stream drop can't trigger a second (billable) generation.
      const fnUrl = `${supabaseUrl}/functions/v1/life-summary`;
      const headers = {
        "content-type": "application/json",
        apikey: supabaseAnonKey,
        authorization: `Bearer ${supabaseAnonKey}`,
      };
      let resp: Response | null = null;
      let netErr: unknown = null;
      for (let attempt = 0; attempt <= 2; attempt++) {
        try {
          resp = await fetch(fnUrl, { method: "POST", headers, body: JSON.stringify({ chart, force }) });
          netErr = null;
          break;
        } catch (e) {
          netErr = e; // couldn't reach the function — usually transient
          if (attempt < 2) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        }
      }
      if (!resp) throw netErr ?? new TypeError("network");
      if (!resp.ok) {
        // Non-2xx → surface the function's (Chinese) error body if present.
        let msg = "生成失败，请稍后再试。";
        try {
          const body = await resp.json();
          if (body?.error) msg = body.error;
        } catch {
          /* keep the generic message */
        }
        throw new Error(msg);
      }

      let finalText = "";
      const ct = resp.headers.get("content-type") ?? "";
      if (ct.includes("application/json") || !resp.body) {
        // Cache hit (or a non-streamed reply) — one-shot text.
        finalText = (await resp.json())?.text ?? "";
        setStory(finalText);
      } else {
        // Streamed generation — append tokens to the displayed story as they arrive.
        const reader = resp.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          setStory(acc);
        }
        finalText = acc;
      }

      if (finalText) {
        const map = loadCache();
        map[key] = { text: finalText, ts: Date.now() };
        saveCache(map);
      }
      return true;
    } catch (e) {
      // A TypeError from fetch/stream = the network dropped; anything else is a
      // function error whose (Chinese) message is already on the Error.
      const msg =
        e instanceof TypeError
          ? "网络连接失败，请稍后重试。"
          : e instanceof Error
            ? e.message
            : "生成失败，请稍后再试。";
      setError(msg);
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  // Pull the current summary straight from the DB without generating — in case it
  // was regenerated elsewhere (another device / user with the same chart) while
  // this client's button is on cooldown.
  const syncFromDb = async () => {
    if (!supabase) return;
    try {
      const { data, error: fnError } = await supabase.functions.invoke<{ text: string }>(
        "life-summary",
        { body: { chart, peek: true } },
      );
      if (fnError) return;
      const text = data?.text ?? "";
      if (text && text !== story) {
        setStory(text);
        const map = loadCache();
        map[chartKey(chart)] = { text, ts: Date.now() };
        saveCache(map);
      }
    } catch {
      /* ignore — keep the current text */
    }
  };

  // 重新生成: one fresh generation, then a 10-minute cooldown before the next.
  const handleRegenerate = async () => {
    if (busy) return;
    if (regenLocked) {
      setShowLockMsg(true); // surface the warning only on a click while locked
      void syncFromDb(); // but still sync the displayed text with the database
      return;
    }
    setShowLockMsg(false);
    const ok = await generate(true);
    if (ok) {
      const ts = Date.now();
      setRegenAt(ts);
      try {
        localStorage.setItem(REGEN_KEY, String(ts));
      } catch {
        /* ignore unavailable storage */
      }
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
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={busy}
                className={`mt-4 ${btnClass} print:hidden`}
              >
                {busy ? "生成中…" : "重新生成"}
              </button>
              {showLockMsg && regenLocked && (
                <p className="mt-3 text-sm font-medium text-red-600 print:hidden">
                  重新生成次数过多，请稍后再试
                </p>
              )}
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

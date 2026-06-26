'use client';

import { useEffect, useRef, useState } from "react";
import { Section } from "../../components/Section";
import { PLANET_COMBOS, PLANETS_ORDER, pairToPlanet } from "../../lib/planets";

// 星属 column metadata for the reference chart (symbol + English name).
const PLANET_META: Record<string, { symbol: string; en: string }> = {
  水星: { symbol: "☿", en: "Mercury" },
  金星: { symbol: "♀", en: "Venus" },
  火星: { symbol: "♂", en: "Mars" },
  木星: { symbol: "♃", en: "Jupiter" },
  土星: { symbol: "♄", en: "Saturn" },
  天王星: { symbol: "♅", en: "Uranus" },
  海王星: { symbol: "♆", en: "Neptune" },
  冥王星: { symbol: "♇", en: "Pluto" },
};
const TIER_LABELS = ["最强能量", "强能量", "中能量", "弱能量"];
const CHART_ORDER = Object.keys(PLANET_COMBOS); // table order (matches the chart)
const ALL_NUMBERS = Object.values(PLANET_COMBOS).flat(); // the 64 combinations

// Fisher–Yates shuffle (a fresh copy each game).
function shuffle(arr: string[]): string[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = "ready" | "playing" | "done";

export default function MemoryPage() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [elapsed, setElapsed] = useState(0); // ms
  // Brief colour confirmation after a click (which button was picked, the right
  // answer, and whether it matched). Doesn't pause the timer.
  const [feedback, setFeedback] = useState<{ picked: string; answer: string; correct: boolean } | null>(null);
  const startRef = useRef(0);

  // Tick the timer while playing.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => setElapsed(Date.now() - startRef.current), 50);
    return () => clearInterval(id);
  }, [phase]);

  const start = () => {
    setQueue(shuffle(ALL_NUMBERS));
    setIndex(0);
    setCorrect(0);
    setTotal(0);
    setElapsed(0);
    setFeedback(null);
    startRef.current = Date.now();
    setPhase("playing");
  };

  const answer = (planet: string) => {
    if (phase !== "playing" || feedback) return; // ignore clicks during the feedback beat
    const answerPlanet = pairToPlanet(queue[index]);
    const isCorrect = answerPlanet === planet;
    setCorrect((c) => c + (isCorrect ? 1 : 0));
    setTotal((t) => t + 1);
    setFeedback({ picked: planet, answer: answerPlanet, correct: isCorrect });
    // Show the colour briefly, then advance — the timer keeps ticking throughout.
    const next = index + 1;
    setTimeout(() => {
      setFeedback(null);
      if (next >= queue.length) {
        setElapsed(Date.now() - startRef.current);
        setPhase("done");
      } else {
        setIndex(next);
      }
    }, 250);
  };

  const seconds = (elapsed / 1000).toFixed(2);
  const pct = (total ? (correct / total) * 100 : 0).toFixed(2);

  return (
    <div id="sec-memory" className="w-full scroll-mt-24">
      <Section title="记忆训练">
        {phase === "ready" ? (
          <>
            <p className="mt-2 leading-relaxed text-zinc-600">
              先记住下方的对照表。点击「开始」后会逐一出现数字，请尽快点击对应的星属。
            </p>

            {/* Reference chart (header + values from 八大组合64组星属数字强弱分析表) */}
            <div className="subcard mt-4 overflow-x-auto rounded-xl border border-amber-100 bg-amber-50/60 p-4">
              <h3 className="mb-3 text-base font-semibold text-amber-900">
                八大组合64组星属数字强弱分析表
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-200 text-zinc-500">
                    <th className="pb-2 text-left font-medium">星属</th>
                    {TIER_LABELS.map((t) => (
                      <th key={t} className="pb-2 text-center font-medium">
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CHART_ORDER.map((planet) => {
                    const c = PLANET_COMBOS[planet];
                    const meta = PLANET_META[planet];
                    return (
                      <tr key={planet} className="border-b border-amber-100/70">
                        <td className="whitespace-nowrap py-1.5 font-medium text-amber-800">
                          {planet} <span className="text-amber-600">{meta?.symbol}</span>{" "}
                          <span className="text-zinc-400">{meta?.en}</span>
                        </td>
                        {[0, 2, 4, 6].map((i) => (
                          <td key={i} className="py-1.5 text-center font-mono tabular-nums text-zinc-700">
                            {c[i]}/{c[i + 1]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={start}
                className="rounded-lg bg-amber-500 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                开始
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-6">
            <h3 className="text-xl font-bold text-amber-900">八大星属64组数字游戏</h3>

            {phase === "playing" ? (
              <>
                {/* Current number */}
                <div className="flex h-32 w-full max-w-md items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-200">
                  <span className="font-mono text-6xl font-bold tracking-wide text-amber-900">
                    {queue[index]}
                  </span>
                </div>

                {/* The eight planets */}
                <div className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
                  {PLANETS_ORDER.map((p) => {
                    // Colour confirmation: picked → green/red; if wrong, the right
                    // answer also turns green.
                    let cls =
                      "border-amber-200 bg-white text-amber-800 hover:bg-amber-100 hover:text-amber-900";
                    if (feedback) {
                      if (feedback.picked === p)
                        cls = feedback.correct
                          ? "border-green-500 bg-green-100 text-green-800"
                          : "border-red-500 bg-red-100 text-red-700";
                      else if (feedback.answer === p)
                        cls = "border-green-500 bg-green-100 text-green-800";
                    }
                    return (
                      <button
                        key={p}
                        type="button"
                        disabled={!!feedback}
                        onClick={() => answer(p)}
                        className={`rounded-xl border py-5 text-base font-semibold shadow-sm transition active:scale-95 ${cls}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                {/* Timer + accuracy — fixed-width tabular numbers so the values
                    don't shift the surrounding text as they tick. */}
                <div className="flex w-full max-w-md items-center justify-center gap-10 rounded-xl border border-amber-100 bg-amber-50/60 p-4 font-semibold text-amber-800">
                  <span className="inline-flex items-center gap-1.5">
                    ⏱<span className="inline-block w-16 text-right tabular-nums">{seconds}</span>秒
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    🎯<span className="inline-block w-16 text-right tabular-nums">{pct}</span>%
                  </span>
                </div>
                <p className="text-sm text-zinc-500">
                  {total} / {queue.length}
                </p>
              </>
            ) : (
              // phase === "done"
              <>
                <div className="flex w-full max-w-md flex-col items-center gap-2 rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">
                  <p className="text-lg font-bold text-amber-900">完成！</p>
                  <p className="font-semibold text-amber-800">⏱ {seconds} 秒 · 🎯 {pct}%</p>
                  <p className="text-sm text-zinc-500">
                    答对 {correct} / {total}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={start}
                  className="rounded-lg bg-amber-500 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-amber-600"
                >
                  再玩一次
                </button>
              </>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

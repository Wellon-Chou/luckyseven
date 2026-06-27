// Supabase Edge Function (Deno) — generates the 总体故事 with DeepSeek (V4 Flash).
// The API key lives only here, never in the browser.
//
// Get an API key:      https://platform.deepseek.com/api_keys
// Set the secret:      supabase secrets set DEEPSEEK_API_KEY=<your key>
// Deploy:              supabase functions deploy life-summary
//
// 总体故事 is a FREE feature: no login or subscription is required. The client
// sends only the chart (the computed numbers); this function reads the source
// interpretation lines itself with the service role (bypassing RLS), so the raw
// detail lines stay gated while the synthesised summary is available to anyone.
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected into Edge Functions
// automatically — no manual secret needed for them.

import { createClient } from "npm:@supabase/supabase-js@^2";

const DEEPSEEK_MODEL = "deepseek-v4-flash";
// Bump when the prompt / length requirement changes so cached summaries (keyed
// by this + the source) are regenerated instead of serving the old shorter text.
const PROMPT_VERSION = "v5";
// Cached summaries "decay": after this long, the next request regenerates a fresh
// one. The cache only exists to stop rapid repeat generations for the same chart.
const CACHE_TTL_MS = 30 * 60 * 1000;

const SYSTEM_PROMPT =
  "你是一位资深的生命灵数解读师。根据用户命盘各部分的要点，撰写一段连贯、温暖、个性化的「总体故事」。" +
  "请以「数字故事」部分为核心重点，用最多的篇幅刻画其中的性格特质；其他部分" +
  "（隐藏性格、能力分布、健康关系、事业和职业选择）作为补充，自然融入即可。" +
  "在「数字故事」中，若某个数字标注「出现 N 次」，代表该性格特质越强烈、越突出，" +
  "出现次数越多越要在故事中着重强调、加重描写。" +
  "要求：用简体中文；把要点自然融合成一个完整的人生故事，而不是逐条罗列；" +
  "不要在正文中出现任何具体数字，只描述这些数字所代表的性格特质，而不提及数字本身；" +
  "保持直接、简明，不要堆砌华丽辞藻或添加多余细节；" +
  "语气真诚、贴近读者；篇幅控制在 300–500 字之间（不少于 300 字，不超过 500 字）；" +
  "只输出故事正文，不要标题、不要要点列表。";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

// Stable hex SHA-256 of a string — the cache key for a summary's source material.
async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Content assembly (mirrors src/lib/content.ts) ──────────────────────────
// Kept in sync by hand: this is the Deno twin of buildContentData +
// collectStorySources so the summary's source material matches the app.

type Lookup = Record<string, string>;
type ContentData = {
  story: Lookup;
  root: Lookup;
  characteristics: Record<string, Lookup>;
  majorminor: Record<string, Lookup>;
  health: Lookup;
  career: Lookup;
};
type ContentRow = { section: string; subtype: string; item_key: string; line: string };
// deno-lint-ignore no-explicit-any
type Chart = any;

const HIDDEN_TYPE_MAP: Record<string, string> = {
  Hidden: "hidden",
  Parents: "parent",
  Impression: "impression",
  Subconscious: "subconscious",
};
const MAJORMINOR_TYPE_MAP: Record<string, string> = {
  Many: "many",
  Less: "less",
  Perfect: "perfect",
};
const ELEMENT_LABEL: Record<string, string> = {
  gold: "金",
  wood: "木",
  water: "水",
  fire: "火",
  earth: "土",
};
const CAREER_ORDER: Record<string, string[]> = {
  gold: ["wood", "earth", "gold"],
  water: ["fire", "gold", "water"],
  wood: ["earth", "water", "wood"],
  fire: ["gold", "wood", "fire"],
  earth: ["water", "fire", "earth"],
};

function buildContentData(rows: ContentRow[]): ContentData {
  const data: ContentData = {
    story: {},
    root: {},
    characteristics: {},
    majorminor: {},
    health: {},
    career: {},
  };
  for (const r of rows) {
    switch (r.section) {
      case "story":
        data.story[r.item_key] = r.line;
        break;
      case "root":
        data.root[r.item_key] = r.line;
        break;
      case "hidden": {
        const k = HIDDEN_TYPE_MAP[r.subtype] ?? r.subtype.toLowerCase();
        (data.characteristics[k] ??= {})[r.item_key] = r.line;
        break;
      }
      case "majorminor": {
        const k = MAJORMINOR_TYPE_MAP[r.subtype] ?? r.subtype.toLowerCase();
        (data.majorminor[k] ??= {})[r.item_key] = r.line;
        break;
      }
      case "health":
        data.health[r.item_key] = r.line;
        break;
      case "career":
        data.career[r.item_key] = r.line;
        break;
    }
  }
  return data;
}

function collectSource(data: ContentData, chart: Chart): string {
  const tidy = (lines: string[]) => lines.map((l) => (l ?? "").trim()).filter(Boolean);

  const story: string[] = [];
  const rootLine = data.root[String(chart.rootNumber)] ?? "";
  if (rootLine) story.push(`根数 ${chart.rootNumber}：${rootLine}`);
  const counts = new Map<string, number>();
  for (const n of chart.storyNumbers ?? []) counts.set(String(n), (counts.get(String(n)) ?? 0) + 1);
  for (const num of chart.uniqueStoryNumbers ?? []) {
    const line = data.story[String(num)] ?? "";
    if (!line) continue;
    const c = counts.get(String(num)) ?? 1;
    story.push(c > 1 ? `${num}（出现 ${c} 次，性格更突出）：${line}` : `${num}：${line}`);
  }

  const hiddenSlots = [
    { key: "hidden", label: "隐藏性格", index: 0 },
    { key: "parent", label: "与父亲关系", index: 1 },
    { key: "parent", label: "与母亲关系", index: 2 },
    { key: "impression", label: "外表给人的感觉", index: 3 },
    { key: "subconscious", label: "潜意识性格", index: 4 },
  ];
  const hidden = hiddenSlots.map((s) => {
    const n = (chart.hiddenNumbers ?? [])[s.index];
    const line = data.characteristics[s.key]?.[String(n)] ?? "";
    return line ? `${s.label}（${n}）：${line}` : "";
  });

  const ability = (chart.countMajorMinor ?? []).map((count: number, i: number) => {
    const key = count == 0 ? "less" : count >= 3 ? "many" : "perfect";
    const line = data.majorminor[key]?.[String(i + 1)] ?? "";
    return line ? `数字 ${i + 1}（出现 ${count} 次）：${line}` : "";
  });

  const health: string[] = [];
  for (const [element, count] of Object.entries(chart.countHealth ?? {})) {
    if (count === 1) continue; // balanced — no warning line
    const line = data.health[element] ?? "";
    if (line) health.push(`${ELEMENT_LABEL[element] ?? element}：${line}`);
  }

  const order = CAREER_ORDER[chart.careerElement] ?? [];
  const career = order.map((el) => {
    const line = data.career[el] ?? "";
    return line ? `${ELEMENT_LABEL[el] ?? el}行：${line}` : "";
  });

  const groups = [
    { title: "数字故事", lines: tidy(story) },
    { title: "隐藏性格", lines: tidy(hidden) },
    { title: "能力分布", lines: tidy(ability) },
    { title: "健康关系", lines: tidy(health) },
    { title: "事业和职业选择", lines: tidy(career) },
  ];

  return groups
    .filter((g) => g.lines.length)
    .map((g) => `【${g.title}】\n${g.lines.join("\n")}`)
    .join("\n\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { chart, force, peek } = (await req.json()) as {
      chart?: Chart;
      force?: boolean;
      peek?: boolean; // read the current DB summary without generating
    };
    if (!chart) return json({ error: "缺少命盘数据。" }, 400);

    // Read the source lines server-side with the service role (bypasses RLS), so
    // free/anonymous users can get a summary without ever receiving the raw lines.
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: rows, error: dbError } = await supa
      .from("content")
      .select("section,subtype,item_key,line");
    if (dbError) return json({ error: "内容读取失败。" }, 500);

    const source = collectSource(buildContentData((rows ?? []) as ContentRow[]), chart);
    if (!source.trim()) return json({ error: "没有可用的内容。" }, 400);

    const sourceHash = await sha256(`${PROMPT_VERSION}|${source}`);

    // Peek: return the current DB summary (any age) without generating. Used to
    // sync a client whose own 重新生成 is on cooldown but the text may have been
    // regenerated elsewhere.
    if (peek) {
      const { data: hit } = await supa
        .from("summary_cache")
        .select("text")
        .eq("source_hash", sourceHash)
        .maybeSingle();
      return json({ text: hit?.text ?? "", cached: true });
    }

    // Cache: a previously generated summary for the same source is returned for
    // free, so repeat requests cost nothing. (总体故事 is a free feature — no login
    // or quota.)
    if (!force) {
      const { data: hit } = await supa
        .from("summary_cache")
        .select("text, created_at")
        .eq("source_hash", sourceHash)
        .maybeSingle();
      // Only serve the cache while it's still fresh; older than the TTL → regenerate.
      if (hit?.text && Date.now() - new Date(hit.created_at).getTime() < CACHE_TTL_MS) {
        return json({ text: hit.text, cached: true });
      }
    }

    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!apiKey) return json({ error: "DEEPSEEK_API_KEY 未配置。" }, 500);

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        // Disable DeepSeek's default chain-of-thought: this is a creative writing
        // task that needs no reasoning, and thinking mode roughly doubles latency.
        thinking: { type: "disabled" },
        temperature: 0.9,
        max_tokens: 2048,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `以下是这位用户命盘各部分的要点：\n\n${source}\n\n请综合以上所有要点，写出一段总体故事。`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ error: `DeepSeek 调用失败：${res.status} ${detail}` }, 502);
    }

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";

    // Cache the result with a fresh timestamp (so the TTL restarts).
    if (text) {
      await supa
        .from("summary_cache")
        .upsert({ source_hash: sourceHash, text, created_at: new Date().toISOString() });
    }

    return json({ text });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

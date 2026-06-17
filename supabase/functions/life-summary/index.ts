// Supabase Edge Function (Deno) — generates the 总体故事 with Groq (free tier,
// no credit card). The API key lives only here, never in the browser.
//
// Get a free API key:  https://console.groq.com/keys
// Set the secret:      supabase secrets set GROQ_API_KEY=<your key>
// Deploy:              supabase functions deploy life-summary
//
// Groq is OpenAI-compatible. To switch model/provider later, only this file
// changes — the app calls the function by name and doesn't care what's behind it.

import { createClient } from "npm:@supabase/supabase-js@^2";

// Free Groq model. To see what your key can use:
//   curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer <KEY>"
// For stronger Chinese output, try a Qwen model from that list if available.
const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT =
  "你是一位资深的生命灵数解读师。根据用户命盘各部分的要点，撰写一段连贯、温暖、个性化的「总体故事」。" +
  "请以「数字故事」部分为核心重点，用最多的篇幅刻画其中的性格特质；其他部分" +
  "（隐藏性格、能力分布、健康关系、事业和职业选择）作为补充，自然融入即可。" +
  "在「数字故事」中，若某个数字标注「出现 N 次」，代表该性格特质越强烈、越突出，" +
  "出现次数越多越要在故事中着重强调、加重描写。" +
  "要求：用简体中文；把要点自然融合成一个完整的人生故事，而不是逐条罗列；" +
  "语气真诚、鼓励、贴近读者；约 200–300 字；只输出故事正文，不要标题、不要要点列表。";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    // Require a logged-in Supabase user (stops an anonymous endpoint from being
    // hammered). supabase-js attaches the user's JWT automatically when calling.
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const {
      data: { user },
    } = await supa.auth.getUser(token);
    if (!user) return json({ error: "未授权，请先登录。" }, 401);

    const { sections } = (await req.json()) as {
      sections?: { title: string; lines: string[] }[];
    };

    const source = (sections ?? [])
      .filter((s) => s.lines?.length)
      .map((s) => `【${s.title}】\n${s.lines.join("\n")}`)
      .join("\n\n");

    if (!source.trim()) return json({ error: "没有可用的内容。" }, 400);

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) return json({ error: "GROQ_API_KEY 未配置。" }, 500);

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.9,
        max_tokens: 1024,
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
      return json({ error: `Groq 调用失败：${res.status} ${detail}` }, 502);
    }

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";

    return json({ text });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

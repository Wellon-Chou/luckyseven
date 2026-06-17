import sheet from "../data/sheet.json";

// number/element -> line, from a flat [{number|element, line|body|careers}] array.
function byKey<T extends Record<string, string>>(
  rows: T[],
  keyField: keyof T,
  valueField: keyof T,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) out[row[keyField]] = row[valueField];
  return out;
}

// Type -> (number -> line), grouping a [{Type, Number, Line}] array. The Type
// is lower-cased and mapped onto the keys the sections already use.
function byTypeNumber<T extends { Type: string; Number: string; Line: string }>(
  rows: T[],
  typeMap: Record<string, string>,
): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    const key = typeMap[row.Type] ?? row.Type.toLowerCase();
    (out[key] ??= {})[row.Number] = row.Line;
  }
  return out;
}

const storylines = byKey(sheet.Story, "number", "line");
const rootLines = byKey(sheet.Root, "number", "line");
const characteristicsLines = byTypeNumber(sheet.Hidden, {
  Hidden: "hidden",
  Parents: "parent",
  Impression: "impression",
  Subconscious: "subconscious",
});
const majorminorLines = byTypeNumber(sheet.MajorMinor, {
  Many: "many",
  Less: "less",
  Perfect: "perfect",
});
const healthLines = byKey(sheet.Health, "element", "body");
const careerLines = byKey(sheet.Career, "element", "careers");

// ── Metadata ──────────────────────────────────────────────────────────────

export const DIRECTION_CATEGORIES: { key: "wealth" | "luck" | "success"; label: string; color: string }[] = [
  { key: "wealth", label: "财富", color: "#d97706" },
  { key: "luck", label: "幸运", color: "#16a34a" },
  { key: "success", label: "成功", color: "#2563eb" },
];

// Five-element display metadata (character + accent colour).
export const ELEMENT_META: Record<string, { label: string; color: string }> = {
  gold: { label: "金", color: "#a16207" },
  wood: { label: "木", color: "#16a34a" },
  water: { label: "水", color: "#2563eb" },
  fire: { label: "火", color: "#dc2626" },
  earth: { label: "土", color: "#d97706" },
};

// Body systems associated with each element (for the Health section).
export const HEALTH_ORGANS: Record<string, string> = {
  gold: "肺 · 呼吸 · 皮肤",
  wood: "肝 · 胆 · 筋",
  water: "肾 · 膀胱 · 骨",
  fire: "心 · 血液循环",
  earth: "脾 · 胃 · 消化",
};

// Career recommendation order per element (best fit first).
export const CAREER_ORDER: Record<string, string[]> = {
  gold: ["wood", "earth", "gold"],
  water: ["fire", "gold", "water"],
  wood: ["earth", "water", "wood"],
  fire: ["gold", "wood", "fire"],
  earth: ["water", "fire", "earth"],
};

// Rank labels for the three career recommendations.
export const CAREER_RANKS = ["首选", "次选", "第三选择"];

// ── Status helpers ──────────────────────────────────────────────────────────

// Balance status for an ability count (0 = lacking, 1-2 = just right, ≥3 = excess).
export function getAbilityStatus(count: number) {
  if (count === 0) return { label: "缺少", color: "#dc2626", bg: "#fee2e2" };
  if (count >= 3) return { label: "偏多", color: "#d97706", bg: "#fef3c7" };
  return { label: "刚刚好", color: "#16a34a", bg: "#dcfce7" };
}

// Balance status for a five-element count (1 = balanced, 0 = lacking, ≥2 = excess).
export function getHealthStatus(count: number) {
  if (count === 1) return { label: "平衡", color: "#16a34a", bg: "#dcfce7", warn: false };
  if (count === 0) return { label: "缺少", color: "#dc2626", bg: "#fee2e2", warn: true };
  return { label: "偏多", color: "#d97706", bg: "#fef3c7", warn: true };
}

// ── Line getters ─────────────────────────────────────────────────────────────

export function getSummaryLine() {
  return "";
}

export function getRootLine(num: string | number) {
  const raw = rootLines[num];
  if (Array.isArray(raw)) return raw.join("\n");
  return raw ?? "";
}

// Story lines may be a single string or an array of lines — normalize to one
// string with newline separators (rendered via `whitespace-pre-line`).
export function getStoryLine(num: string) {
  const raw = storylines[num];
  if (Array.isArray(raw)) return raw.join("\n");
  return raw ?? "";
}

const storyTitles: Record<string, string> = {
  "1": "孤独",
  "2": "健谈",
  "3": "积极",
  "4": "计划",
  "5": "固执",
  "6": "金钱",
  "7": "支持者",
  "8": "压力",
  "9": "生意",
};
export function getStoryTitles(num: string) {
  const words = num.split("").map((d) => storyTitles[d]).filter(Boolean);
  if (Number(num) < 10) return words.length ? `关键性格 — ${words[0]}` : "";
  else if (Number(num) < 20) return words.length ? `你；${words[1]}` : "";
  else if (Number(num) == 33) return words.length ? `积极；侵略性` : "";
  return words.length ? `${words.join("；")}` : "";
}

export function getCharacteristicsLine(key: string, num: string | number) {
  const raw = characteristicsLines[key]?.[num];
  if (Array.isArray(raw)) return raw.join("\n");
  return raw ?? "";
}

export function getMajorMinorLine(index: number, num: number) {
  const key = num == 0 ? "less" : num >= 3 ? "many" : "perfect";
  const raw = majorminorLines[key]?.[index + 1];
  if (Array.isArray(raw)) return raw.join("\n");
  return raw ?? "";
}

export function getHealthLine(element: string, count: number) {
  if (count == 1) return "";
  const raw = healthLines[element];
  if (Array.isArray(raw)) return raw.join("\n");
  return raw ?? "";
}

export function getCareerPlan(element: string) {
  const order = CAREER_ORDER[element] ?? [];
  return order.map((el) => {
    const raw = careerLines[el];
    const line = Array.isArray(raw) ? raw.join("\n") : raw ?? "";
    return { element: el, line };
  });
}

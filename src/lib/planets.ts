// 八大行星组合 64 组星属数字强弱分析表.
// Every 2-digit combination of the digits 1–9 (excluding 5) belongs to one of
// the eight planets. The four arrays per planet are the energy tiers
// (最强能量 / 强能量 / 中能量 / 弱能量), each holding the two reverse pairs.
// 8 planets × 4 tiers × 2 pairs = 64 combinations.
//
// Any combination containing a 5 or a 0 is not in the 64 — it maps to 土星.

// Display order for the 星属统计 / 总数 tables (rows top-to-bottom).
export const PLANETS_ORDER = [
  "金星",
  "木星",
  "水星",
  "土星",
  "火星",
  "天王星",
  "海王星",
  "冥王星",
] as const;

export const PLANET_COMBOS: Record<string, string[]> = {
  水星: ["14", "41", "67", "76", "39", "93", "28", "82"],
  金星: ["13", "31", "68", "86", "49", "94", "27", "72"],
  火星: ["17", "71", "89", "98", "46", "64", "23", "32"],
  木星: ["19", "91", "78", "87", "34", "43", "26", "62"],
  土星: ["11", "22", "99", "88", "77", "66", "44", "33"],
  天王星: ["12", "21", "69", "96", "48", "84", "37", "73"],
  海王星: ["16", "61", "47", "74", "38", "83", "29", "92"],
  冥王星: ["18", "81", "79", "97", "36", "63", "24", "42"],
};

// Reverse index: combination → planet.
const COMBO_TO_PLANET: Record<string, string> = {};
for (const [planet, combos] of Object.entries(PLANET_COMBOS)) {
  for (const combo of combos) COMBO_TO_PLANET[combo] = planet;
}

// Planet for a 2-digit combination. Anything with a 5 or 0 is 土星; everything
// else is looked up in the 64-combination table.
export function pairToPlanet(pair: string): string {
  if (/[05]/.test(pair)) return "土星";
  return COMBO_TO_PLANET[pair] ?? "";
}

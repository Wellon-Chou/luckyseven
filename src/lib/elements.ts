import { reduceToSingle } from "./numerology";

// 五行 (five elements). Display order mirrors the digit pairs below.
export const ELEMENTS_ORDER = ["金", "水", "火", "木", "土"] as const;

// Single digit → 五行 element:
//   1,6 → 金   2,7 → 水   3,8 → 火   4,9 → 木   5,0 → 土
export function digitToElement(n: number): string {
  switch (n) {
    case 1:
    case 6:
      return "金";
    case 2:
    case 7:
      return "水";
    case 3:
    case 8:
      return "火";
    case 4:
    case 9:
      return "木";
    default:
      return "土"; // 5, 0
  }
}

// Element for a 2-digit combination: reduce it to a single digit first.
// e.g. "67" → 6+7 = 13 → 4 → 木.
export function pairToElement(pair: string): string {
  return digitToElement(reduceToSingle(Number(pair)));
}

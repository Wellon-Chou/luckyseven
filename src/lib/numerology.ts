// Pure numerology calculation — no React, fully testable.

// Reduce a number to a single digit by repeatedly summing its digits
// (e.g. 89 -> 17 -> 8, 19 -> 10 -> 1)
export function reduceToSingle(n: number): number {
  if (Number.isNaN(n)) return NaN;
  if (n === 0) return 5; // 0 maps to 5
  while (n >= 10) {
    let sum = 0;
    while (n > 0) {
      sum += n % 10;
      n = Math.floor(n / 10);
    }
    n = sum;
  }
  return n;
}

// Chart values are numeric; show "–" until a date produces real numbers.
export const show = (n: number): number | string => (Number.isNaN(n) ? "–" : n);

// Adjacent 2-digit combinations of a number string (sliding window, step 1).
// Non-digits are stripped first. "19123456701" → ["19","91","12",…,"01"] (n-1).
export function adjacentPairs(raw: string): string[] {
  const digits = (raw ?? "").replace(/\D/g, "");
  const pairs: string[] = [];
  for (let i = 0; i + 1 < digits.length; i++) pairs.push(digits.slice(i, i + 2));
  return pairs;
}

// Convert an IC like "S1234567A" into an 11-digit string by replacing the
// leading and trailing letters with their 2-digit alphabet position
// (A → 01, S → 19, Z → 26); digits in between are kept as-is.
// "S1234567A" → "19" + "1234567" + "01" = "19123456701".
export function icToNumber(raw: string): string {
  const ic = (raw ?? "").trim().toUpperCase();
  if (ic.length < 2) return ic;
  const letterToPair = (c: string) =>
    /[A-Z]/.test(c) ? String(c.charCodeAt(0) - 64).padStart(2, "0") : c;
  const first = letterToPair(ic[0]);
  const last = letterToPair(ic[ic.length - 1]);
  const middle = ic.slice(1, -1);
  return first + middle + last;
}

export type DirectionSummary = { count: number; directions: string[] };

export type Chart = {
  numbers: string[];
  reducedBirthDate: number[];
  middle: number[];
  rootNumber: number;
  belowLeft: number;
  belowRight: number;
  belowLast: number;
  leftSide: number[];
  rightSide: number[];
  storyNumbers: string[];
  uniqueStoryNumbers: string[];
  hiddenNumbers: number[];
  countMajorMinor: number[];
  countHealth: Record<string, number>;
  careerElement: string;
  countDirections: Record<"wealth" | "luck" | "success", DirectionSummary>;
  directionValues: Record<string, number>; // every direction's reduced value (中, 北, …)
};

// Compute every derived value from a "YYYY-MM-DD" birth date string.
// When birthDate is empty, returns the placeholder (NaN / empty) shape.
export function computeChart(birthDate: string): Chart {
  // birthDate from <input type="date"> is "YYYY-MM-DD"
  const [year, month, day] = birthDate ? birthDate.split("-") : ["", "", ""];
  const numbers = birthDate
    ? [day, month, year.slice(0, 2), year.slice(2, 4)]
    : ["–", "–", "–", "–"];

  // First 4 numbers based on birth date, reduced to a single digit (top tier).
  const reducedBirthDate = birthDate
    ? numbers.map((s) => reduceToSingle(Number(s)))
    : [NaN, NaN, NaN, NaN];

  // Next 2 numbers in the middle tier: reduced sum of the pairs above.
  const middle = birthDate
    ? [
        reduceToSingle(reducedBirthDate[0] + reducedBirthDate[1]),
        reduceToSingle(reducedBirthDate[2] + reducedBirthDate[3]),
      ]
    : [NaN, NaN];

  // Bottom triangle: reduced sum of the two middle numbers.
  const rootNumber = birthDate ? reduceToSingle(middle[0] + middle[1]) : NaN;

  // Below the baseline: reduced sum of each middle number + the bottom number.
  const belowRight = birthDate ? reduceToSingle(middle[0] + rootNumber) : NaN;
  const belowLeft = birthDate ? reduceToSingle(middle[1] + rootNumber) : NaN;
  const belowLast = birthDate ? reduceToSingle(belowLeft + belowRight) : NaN;

  // Side numbers (outside the triangle): two addends + their sum.
  const leftSide = birthDate
    ? (() => {
        const a = reduceToSingle(reducedBirthDate[0] + middle[0]);
        const b = reduceToSingle(reducedBirthDate[1] + middle[0]);
        return [a, b, reduceToSingle(a + b)];
      })()
    : [NaN, NaN, NaN];
  const rightSide = birthDate
    ? (() => {
        const a = reduceToSingle(reducedBirthDate[2] + middle[1]);
        const b = reduceToSingle(reducedBirthDate[3] + middle[1]);
        return [a, b, reduceToSingle(a + b)];
      })()
    : [NaN, NaN, NaN];

  // The 11 story numbers.
  const storyNumbers = birthDate
    ? [
        `${reducedBirthDate[0]}${reducedBirthDate[1]}`,
        `${reducedBirthDate[2]}${reducedBirthDate[3]}`,
        `${middle[0]}${middle[1]}`,
        `${leftSide[0]}${leftSide[1]}`,
        `${rightSide[0]}${rightSide[1]}`,
        `${belowLeft}${belowRight}`,
        `${reducedBirthDate[3]}${middle[1]}`,
        `${middle[1]}`,
        `${middle[1]}${rootNumber}`,
        `${rootNumber}${belowLeft}`,
      ]
    : [];
  // Drop duplicates, keeping the first occurrence.
  const uniqueStoryNumbers = [...new Set(storyNumbers)];

  const hiddenNumbers = birthDate
    ? [
        reduceToSingle(reducedBirthDate[1] + reducedBirthDate[2]),
        reduceToSingle(reducedBirthDate[0] + reducedBirthDate[1] + middle[0]),
        reduceToSingle(reducedBirthDate[2] + reducedBirthDate[3] + middle[1]),
        reduceToSingle(middle[0] + middle[1] + rootNumber),
        reduceToSingle(reducedBirthDate[0] + reducedBirthDate[3] + rootNumber),
      ]
    : [];

  // Count occurrences of each digit 1-9 across the chart numbers.
  const countMajorMinor = birthDate
    ? (() => {
        const counts = Array(9).fill(0);
        [...reducedBirthDate, ...middle, rootNumber, ...hiddenNumbers].forEach((n) => {
          if (n >= 1 && n <= 9) counts[n - 1] += 1;
        });
        return counts;
      })()
    : Array(9).fill(0);

  const countHealth = birthDate
    ? (() => {
        const counts: Record<string, number> = { gold: 0, water: 0, fire: 0, wood: 0, earth: 0 };
        [...middle, rootNumber, belowLeft, belowRight].forEach((n) => {
          if (n == 1 || n == 6) counts.gold += 1;
          else if (n == 2 || n == 7) counts.water += 1;
          else if (n == 3 || n == 8) counts.fire += 1;
          else if (n == 4 || n == 9) counts.wood += 1;
          else counts.earth += 1;
        });
        return counts;
      })()
    : { gold: 0, water: 0, fire: 0, wood: 0, earth: 0 };

  const careerElement = birthDate
    ? (() => {
        if (rootNumber == 1 || rootNumber == 6) return "gold";
        else if (rootNumber == 2 || rootNumber == 7) return "water";
        else if (rootNumber == 3 || rootNumber == 8) return "fire";
        else if (rootNumber == 4 || rootNumber == 9) return "wood";
        return "earth";
      })()
    : "";

  // Every direction's reduced value (computed in order — east/west depend on the
  // diagonal values). NaN when there's no birth date yet.
  const directionList = birthDate
    ? (() => {
        const center = reduceToSingle(reducedBirthDate[1] + reducedBirthDate[2] + middle[0] + middle[1]);
        const north = reduceToSingle(reducedBirthDate[1] + reducedBirthDate[2]);
        const south = reduceToSingle(middle[0] + middle[1] + rootNumber);
        const northeast = reduceToSingle(reducedBirthDate[2] + reducedBirthDate[3] + middle[1]);
        const southeast = reduceToSingle(reducedBirthDate[3] + middle[1] + rootNumber);
        const east = reduceToSingle(northeast + southeast);
        const northwest = reduceToSingle(reducedBirthDate[0] + reducedBirthDate[1] + middle[0]);
        const southwest = reduceToSingle(reducedBirthDate[0] + middle[0] + rootNumber);
        const west = reduceToSingle(northwest + southwest);
        return [
          { name: "中", value: center },
          { name: "北", value: north },
          { name: "南", value: south },
          { name: "东北", value: northeast },
          { name: "东南", value: southeast },
          { name: "东", value: east },
          { name: "西北", value: northwest },
          { name: "西南", value: southwest },
          { name: "西", value: west },
        ];
      })()
    : ["中", "北", "南", "东北", "东南", "东", "西北", "西南", "西"].map((name) => ({
        name,
        value: NaN,
      }));

  const directionValues: Record<string, number> = Object.fromEntries(
    directionList.map((d) => [d.name, d.value]),
  );

  // 6 - 财富方向，7 - 幸运方向，9 - 成功方向
  const summarizeDir = (target: number): DirectionSummary => {
    const matched = directionList.filter((d) => (d.value === target && d.name !== "中"));
    return { count: matched.length, directions: matched.map((d) => d.name) };
  };
  const countDirections = {
    wealth: summarizeDir(6),
    luck: summarizeDir(7),
    success: summarizeDir(9),
  };

  return {
    numbers,
    reducedBirthDate,
    middle,
    rootNumber,
    belowLeft,
    belowRight,
    belowLast,
    leftSide,
    rightSide,
    storyNumbers,
    uniqueStoryNumbers,
    hiddenNumbers,
    countMajorMinor,
    countHealth,
    careerElement,
    countDirections,
    directionValues,
  };
}

// The numbers shown in the 数字故事 section: the root number + the unique story
// numbers, with the two single-digit ones expanded to 2 digits:
//   • rootNumber  →  rootNumber + reducedBirthDate[0]
//   • middle[1]   →  middle[1]  + middle[1]   (the only single-digit story entry)
// Returns [] until a birth date produces real numbers.
export function blueprintNumbers(chart: Chart): string[] {
  const { rootNumber, reducedBirthDate, storyNumbers } = chart;
  if (Number.isNaN(rootNumber)) return [];
  return [
    `${rootNumber}${reducedBirthDate[0]}`,
    ...storyNumbers.map((n) => (n.length === 1 ? `${n}${n}` : n)),
  ];
}

// The numbers behind the 健康关系 section (the same ones countHealth tallies):
// the two middle numbers, the root number, and the two below-baseline numbers.
// Returns [] until a birth date produces real numbers.
export function healthNumbers(chart: Chart): string[] {
  const { middle, rootNumber, belowLeft, belowRight } = chart;
  if (Number.isNaN(rootNumber)) return [];
  return [...middle, rootNumber, belowLeft, belowRight].map(String);
}

// Cumulative chart: sum each person's first row (reducedBirthDate) column-wise,
// reduce to single digits, then derive the rest of the pyramid the same way
// computeChart does. Charts without a birth date are ignored.
export function cumulativeChart(charts: Chart[]): Chart {
  const valid = charts.filter((c) => !Number.isNaN(c.reducedBirthDate[0]));
  const reducedBirthDate =
    valid.length === 0
      ? [NaN, NaN, NaN, NaN]
      : [0, 1, 2, 3].map((j) =>
          reduceToSingle(valid.reduce((sum, c) => sum + c.reducedBirthDate[j], 0)),
        );

  const middle = [
    reduceToSingle(reducedBirthDate[0] + reducedBirthDate[1]),
    reduceToSingle(reducedBirthDate[2] + reducedBirthDate[3]),
  ];
  const rootNumber = reduceToSingle(middle[0] + middle[1]);
  const belowRight = reduceToSingle(middle[0] + rootNumber);
  const belowLeft = reduceToSingle(middle[1] + rootNumber);
  const belowLast = reduceToSingle(belowLeft + belowRight);

  const ls0 = reduceToSingle(reducedBirthDate[0] + middle[0]);
  const ls1 = reduceToSingle(reducedBirthDate[1] + middle[0]);
  const leftSide = [ls0, ls1, reduceToSingle(ls0 + ls1)];
  const rs0 = reduceToSingle(reducedBirthDate[2] + middle[1]);
  const rs1 = reduceToSingle(reducedBirthDate[3] + middle[1]);
  const rightSide = [rs0, rs1, reduceToSingle(rs0 + rs1)];

  return {
    numbers: ["–", "–", "–", "–"],
    reducedBirthDate,
    middle,
    rootNumber,
    belowLeft,
    belowRight,
    belowLast,
    leftSide,
    rightSide,
    storyNumbers: [],
    uniqueStoryNumbers: [],
    hiddenNumbers: [],
    countMajorMinor: Array(9).fill(0),
    countHealth: { gold: 0, water: 0, fire: 0, wood: 0, earth: 0 },
    careerElement: "",
    countDirections: {
      wealth: { count: 0, directions: [] },
      luck: { count: 0, directions: [] },
      success: { count: 0, directions: [] },
    },
    directionValues: {},
  };
}

// "Shadow numbers" chart: double every number (n → reduce(n + n)), e.g. the top
// row 8 9 1 8 → 7 9 2 7. Doubling the top row and re-deriving the pyramid is the
// same as doubling every number, since doubling is linear under the digital root.
export function shadowChart(chart: Chart): Chart {
  const reducedBirthDate = chart.reducedBirthDate.map((n) => reduceToSingle(n + n));

  const middle = [
    reduceToSingle(reducedBirthDate[0] + reducedBirthDate[1]),
    reduceToSingle(reducedBirthDate[2] + reducedBirthDate[3]),
  ];
  const rootNumber = reduceToSingle(middle[0] + middle[1]);
  const belowRight = reduceToSingle(middle[0] + rootNumber);
  const belowLeft = reduceToSingle(middle[1] + rootNumber);
  const belowLast = reduceToSingle(belowLeft + belowRight);

  const ls0 = reduceToSingle(reducedBirthDate[0] + middle[0]);
  const ls1 = reduceToSingle(reducedBirthDate[1] + middle[0]);
  const leftSide = [ls0, ls1, reduceToSingle(ls0 + ls1)];
  const rs0 = reduceToSingle(reducedBirthDate[2] + middle[1]);
  const rs1 = reduceToSingle(reducedBirthDate[3] + middle[1]);
  const rightSide = [rs0, rs1, reduceToSingle(rs0 + rs1)];

  return {
    numbers: chart.numbers, // the row above the diagram stays the same in both modes
    reducedBirthDate,
    middle,
    rootNumber,
    belowLeft,
    belowRight,
    belowLast,
    leftSide,
    rightSide,
    storyNumbers: [],
    uniqueStoryNumbers: [],
    hiddenNumbers: [],
    countMajorMinor: Array(9).fill(0),
    countHealth: { gold: 0, water: 0, fire: 0, wood: 0, earth: 0 },
    careerElement: "",
    countDirections: {
      wealth: { count: 0, directions: [] },
      luck: { count: 0, directions: [] },
      success: { count: 0, directions: [] },
    },
    directionValues: {},
  };
}

// Build a chart from just the two middle numbers — the rest of the pyramid from
// the middle down (root + below-baseline) is derived as usual. The top tier
// (reducedBirthDate) and side equations are left blank (NaN) to be filled later.
// A null/empty middle yields the all-blank placeholder.
export function chartFromMiddle(middle: readonly [number, number] | null | undefined): Chart {
  if (!middle) return computeChart("");
  const [m0, m1] = middle;
  const rootNumber = reduceToSingle(m0 + m1);
  const belowRight = reduceToSingle(m0 + rootNumber);
  const belowLeft = reduceToSingle(m1 + rootNumber);
  const belowLast = reduceToSingle(belowLeft + belowRight);
  return {
    numbers: ["–", "–", "–", "–"],
    reducedBirthDate: [NaN, NaN, NaN, NaN],
    middle: [m0, m1],
    rootNumber,
    belowLeft,
    belowRight,
    belowLast,
    leftSide: [NaN, NaN, NaN],
    rightSide: [NaN, NaN, NaN],
    storyNumbers: [],
    uniqueStoryNumbers: [],
    hiddenNumbers: [],
    countMajorMinor: Array(9).fill(0),
    countHealth: { gold: 0, water: 0, fire: 0, wood: 0, earth: 0 },
    careerElement: "",
    countDirections: {
      wealth: { count: 0, directions: [] },
      luck: { count: 0, directions: [] },
      success: { count: 0, directions: [] },
    },
    directionValues: {},
  };
}

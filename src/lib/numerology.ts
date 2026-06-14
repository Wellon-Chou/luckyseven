// Pure numerology calculation — no React, fully testable.

// Reduce a number to a single digit by repeatedly summing its digits
// (e.g. 89 -> 17 -> 8, 19 -> 10 -> 1)
export function reduceToSingle(n: number): number {
  if (Number.isNaN(n)) return NaN;
  if (n === 0) return 5; // 0 / "00" (e.g. year 2000) maps to 5
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

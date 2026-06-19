import { show, type Chart } from "../lib/numerology";

// Layout positions for the chart numbers (hardcoded for the 4-number layout).
const reducedX = [188, 329, 471, 612]; // top tier: 2 left, 2 right
// The same columns as a % of the 800-wide viewBox, for the HTML rows above the
// SVG so they line up with each other and with the diagram's first row.
const reducedXPct = reducedX.map((x) => (x / 800) * 100);
const middleX = [310, 490]; // middle tier: left, right
const sideY = 430; // vertical position of the side equations — level with the root number

// Colours come from CSS variables (see globals.css) so the chart adapts to the
// dark theme. SVG presentation attributes don't accept var(), so they're applied
// via `style` instead.
const textStyle = { fill: "var(--chart-text)" };
const lineStyle = { stroke: "var(--chart-line)" };

// The inverted-pyramid Life Chart diagram (the four date numbers + SVG).
// `topRows` overrides the single date-number row with multiple rows (used by the
// cumulative chart to show each person's reducedBirthDate above the pyramid).
// `hideTop` suppresses the number row entirely (used when the caller renders its
// own custom rows above the pyramid).
export function BaseChart({
  chart,
  topRows,
  hideTop,
}: {
  chart: Chart;
  topRows?: number[][];
  hideTop?: boolean;
}) {
  const {
    numbers,
    reducedBirthDate,
    middle,
    rootNumber,
    belowLeft,
    belowRight,
    belowLast,
    leftSide,
    rightSide,
  } = chart;

  return (
    <>
      {/* Four numbers from the birth date, equidistant above the diagram.
          Sized in cqw so they scale with the chart like the in-SVG numbers
          (SVG fontSize 30 / viewBox 800 = 3.75% of the container width). */}
      {hideTop ? null : topRows ? (
        <div className="-mb-[1.8cqw] flex flex-col gap-0.5">
          {topRows.map((row, r) => (
            <div key={r} className="relative h-[4.5cqw]">
              {row.map((n, i) => (
                <span
                  key={i}
                  style={{ left: `${reducedXPct[i]}%` }}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[3.75cqw] font-semibold text-amber-800"
                >
                  {show(n)}
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="relative -mb-[1.8cqw] h-[4.5cqw]">
          {numbers.map((n, i) => (
            <span
              key={i}
              style={{ left: `${reducedXPct[i]}%` }}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[3.75cqw] font-semibold text-amber-800"
            >
              {n}
            </span>
          ))}
        </div>
      )}
      <svg
        viewBox="0 0 800 720"
        className="w-full"
        fill="none"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ stroke: "var(--chart-stroke)" }}
      >
        <defs>
          <filter id="triShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" floodOpacity="0.18" style={{ floodColor: "var(--chart-flood)" }} />
          </filter>
        </defs>

        {/* Soft shadow cast by the whole pyramid */}
        <polygon points="60,40 740,40 400,520" stroke="none" filter="url(#triShadow)" style={{ fill: "var(--chart-shadow)" }} />

        {/* Tier fills — layers behind the outline */}
        <polygon points="60,40 740,40 633.75,190 166.25,190" stroke="none" style={{ fill: "var(--chart-fill-1)" }} />
        <polygon points="166.25,190 633.75,190 527.5,340 272.5,340" stroke="none" style={{ fill: "var(--chart-fill-2)" }} />
        <polygon points="272.5,340 527.5,340 400,520" stroke="none" style={{ fill: "var(--chart-fill-3)" }} />

        {/* Outer inverted triangle */}
        <polygon points="60,40 740,40 400,520" />

        {/* Tier divider 1 (upper) — splits upper region into two equal tiers */}
        <line x1="166.25" y1="190" x2="633.75" y2="190" strokeWidth={1.5} style={lineStyle} />

        {/* Tier divider 2 (lower) — top of the enlarged bottom triangle */}
        <line x1="272.5" y1="340" x2="527.5" y2="340" strokeWidth={1.5} style={lineStyle} />

        {/* Vertical center line — from top edge down to the second divider */}
        <line x1="400" y1="40" x2="400" y2="340" strokeWidth={1.5} style={lineStyle} />

        {/* Baseline — touches the apex, extends past the triangle on both sides */}
        <line x1="20" y1="520" x2="780" y2="520" />

        {/* Single-digit reductions inside the top tier (2 left, 2 right) */}
        {reducedBirthDate.map((n, i) => (
          <text
            key={i}
            x={reducedX[i]}
            y="130"
            textAnchor="middle"
            fontSize="30"
            fontWeight="600"
            stroke="none"
            style={textStyle}
          >
            {show(n)}
          </text>
        ))}

        {/* Middle tier: reduced sum of the pair above (1 left, 1 right) */}
        {middle.map((n, i) => (
          <text
            key={i}
            x={middleX[i]}
            y="280"
            textAnchor="middle"
            fontSize="30"
            fontWeight="600"
            stroke="none"
            style={textStyle}
          >
            {show(n)}
          </text>
        ))}

        {/* Bottom triangle: reduced sum of the two middle numbers, centered */}
        <text
          x="400"
          y="430"
          textAnchor="middle"
          fontSize="38"
          fontWeight="700"
          stroke="none"
          style={{ fill: "var(--chart-root)" }}
        >
          {show(rootNumber)}
        </text>

        {/* Below the baseline: middle + bottom (1 left, 1 right) */}
        <text x="300" y="600" textAnchor="middle" fontSize="30" fontWeight="600" stroke="none" style={textStyle}>
          {show(belowLeft)}
        </text>
        <text x="500" y="600" textAnchor="middle" fontSize="30" fontWeight="600" stroke="none" style={textStyle}>
          {show(belowRight)}
        </text>

        <text x="400" y="700" textAnchor="middle" fontSize="30" fontWeight="600" stroke="none" style={textStyle}>
          {show(belowLast)}
        </text>

        {/* Left side: {sum} = {A} {B}, outside the triangle */}
        <text
          x="150"
          y={sideY}
          textAnchor="middle"
          fontSize="30"
          fontWeight="500"
          stroke="none"
          wordSpacing="20"
          style={textStyle}
        >
          {`${show(leftSide[2])} = ${show(leftSide[0])} ${show(leftSide[1])}`}
        </text>

        {/* Right side: {A} {B} = {sum}, outside the triangle */}
        <text
          x="650"
          y={sideY}
          textAnchor="middle"
          fontSize="30"
          fontWeight="500"
          stroke="none"
          wordSpacing="20"
          style={textStyle}
        >
          {`${show(rightSide[0])} ${show(rightSide[1])} = ${show(rightSide[2])}`}
        </text>
      </svg>
    </>
  );
}

import { show, type Chart } from "../lib/numerology";

// Layout positions for the chart numbers (hardcoded for the 4-number layout).
const reducedX = [188, 329, 471, 612]; // top tier: 2 left, 2 right
const middleX = [310, 490]; // middle tier: left, right
const sideY = 475; // vertical position of the side equations

// The inverted-pyramid Life Chart diagram (the four date numbers + SVG).
export function BaseChart({ chart }: { chart: Chart }) {
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
      <div className="-mb-3 flex justify-evenly">
        {numbers.map((n, i) => (
          <span key={i} className="text-[3.75cqw] font-semibold text-amber-800">
            {n}
          </span>
        ))}
      </div>
      <svg
        viewBox="0 0 800 720"
        className="w-full"
        fill="none"
        stroke="#78350f"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <defs>
          <filter id="triShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#b45309" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* Soft shadow cast by the whole pyramid */}
        <polygon points="60,40 740,40 400,520" fill="#fde68a" stroke="none" filter="url(#triShadow)" />

        {/* Tier fills — pastel layers behind the outline */}
        <polygon points="60,40 740,40 633.75,190 166.25,190" fill="#fef3c7" stroke="none" />
        <polygon points="166.25,190 633.75,190 527.5,340 272.5,340" fill="#fde68a" stroke="none" />
        <polygon points="272.5,340 527.5,340 400,520" fill="#fcd34d" stroke="none" />

        {/* Outer inverted triangle */}
        <polygon points="60,40 740,40 400,520" />

        {/* Tier divider 1 (upper) — splits upper region into two equal tiers */}
        <line x1="166.25" y1="190" x2="633.75" y2="190" stroke="#b45309" strokeWidth={1.5} />

        {/* Tier divider 2 (lower) — top of the enlarged bottom triangle */}
        <line x1="272.5" y1="340" x2="527.5" y2="340" stroke="#b45309" strokeWidth={1.5} />

        {/* Vertical center line — from top edge down to the second divider */}
        <line x1="400" y1="40" x2="400" y2="340" stroke="#b45309" strokeWidth={1.5} />

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
            fill="#78350f"
            stroke="none"
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
            fill="#78350f"
            stroke="none"
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
          fill="#7c2d12"
          stroke="none"
        >
          {show(rootNumber)}
        </text>

        {/* Below the baseline: middle + bottom (1 left, 1 right) */}
        <text x="300" y="600" textAnchor="middle" fontSize="30" fontWeight="600" fill="#78350f" stroke="none">
          {show(belowLeft)}
        </text>
        <text x="500" y="600" textAnchor="middle" fontSize="30" fontWeight="600" fill="#78350f" stroke="none">
          {show(belowRight)}
        </text>

        <text x="400" y="700" textAnchor="middle" fontSize="30" fontWeight="600" fill="#78350f" stroke="none">
          {show(belowLast)}
        </text>

        {/* Left side: {sum} = {A} {B}, outside the triangle */}
        <text
          x="150"
          y={sideY}
          textAnchor="middle"
          fontSize="30"
          fontWeight="500"
          fill="#78350f"
          stroke="none"
          wordSpacing="20"
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
          fill="#78350f"
          stroke="none"
          wordSpacing="20"
        >
          {`${show(rightSide[0])} ${show(rightSide[1])} = ${show(rightSide[2])}`}
        </text>
      </svg>
    </>
  );
}

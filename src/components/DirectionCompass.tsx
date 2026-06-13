import { DIRECTION_CATEGORIES } from "../lib/content";
import { type DirectionSummary } from "../lib/numerology";

// 8 compass directions with their angle (clockwise from north).
const COMPASS_DIRS = [
  { name: "北", deg: 0 },
  { name: "东北", deg: 45 },
  { name: "东", deg: 90 },
  { name: "东南", deg: 135 },
  { name: "南", deg: 180 },
  { name: "西南", deg: 225 },
  { name: "西", deg: 270 },
  { name: "西北", deg: 315 },
];

// Circular compass that highlights directions mentioned in the cards, colour-coded by category.
export function DirectionCompass({
  data,
}: {
  data: Record<"wealth" | "luck" | "success", DirectionSummary>;
}) {
  const cx = 125;
  const cy = 125;
  const pos = (deg: number, r: number): [number, number] => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
  };
  const catsFor = (name: string) =>
    DIRECTION_CATEGORIES.filter((c) => data[c.key].directions.includes(name));

  // Compass-rose star: long cardinal points, short diagonal points.
  const star: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    star.push(pos(i * 45, i % 2 === 0 ? 60 : 40));
    star.push(pos(i * 45 + 22.5, 16));
  }
  const starPoints = star.map((p) => p.join(",")).join(" ");

  const renderNode = (name: string, x: number, y: number) => {
    const cats = catsFor(name);
    const on = cats.length > 0;
    return (
      <g key={name}>
        <circle
          cx={x}
          cy={y}
          r={18}
          fill={on ? "#fde68a" : "#ffffff"}
          stroke={on ? "#d97706" : "#e7d9c0"}
          strokeWidth={on ? 2.5 : 1.5}
        />
        <text
          x={x}
          y={on ? y - 1 : y + 4}
          textAnchor="middle"
          fontSize={name.length > 1 ? 11 : 14}
          fontWeight="700"
          fill={on ? "#7c2d12" : "#a8a29e"}
        >
          {name}
        </text>
        {on && (
          <g>
            {cats.map((c, i) => (
              <circle
                key={c.key}
                cx={x + (i - (cats.length - 1) / 2) * 7}
                cy={y + 9}
                r={2.6}
                fill={c.color}
              />
            ))}
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 250 250" className="w-full max-w-[230px]">
        {/* dial rings */}
        <circle cx={cx} cy={cy} r={118} fill="#fffdf7" stroke="#e7c98f" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={113} fill="none" stroke="#f3e3c0" strokeWidth={1} />

        {/* tick marks */}
        {Array.from({ length: 16 }).map((_, i) => {
          const deg = i * 22.5;
          const long = i % 2 === 0;
          const [x1, y1] = pos(deg, 112);
          const [x2, y2] = pos(deg, long ? 102 : 106);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d6a868" strokeWidth={long ? 1.6 : 1} />
          );
        })}

        {/* compass rose */}
        <polygon points={starPoints} fill="#fef3c7" stroke="#e0a73d" strokeWidth={0.8} opacity={0.9} />
        {/* red north point */}
        <polygon
          points={`${pos(0, 60).join(",")} ${pos(337.5, 16).join(",")} ${pos(22.5, 16).join(",")}`}
          fill="#dc2626"
          opacity={0.85}
        />

        {/* direction labels around the dial */}
        {COMPASS_DIRS.map((d) => {
          const [x, y] = pos(d.deg, 86);
          return renderNode(d.name, x, y);
        })}

        {/* center hub */}
        {renderNode("中", cx, cy)}
      </svg>

      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-zinc-600">
        {DIRECTION_CATEGORIES.map((c) => (
          <span key={c.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

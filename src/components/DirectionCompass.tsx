import { DIRECTION_CATEGORIES } from "../lib/content";

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

// Circular compass that shows every direction's value and highlights the ones
// picked (6 财富 / 7 幸运 / 9 成功), colour-coded by category.
export function DirectionCompass({
  values,
}: {
  values: Record<string, number>;
}) {
  const cx = 125;
  const cy = 125;
  const pos = (deg: number, r: number): [number, number] => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
  };
  // A direction's value matches at most one category: 6 → 财富, 7 → 幸运, 9 → 成功.
  const catForValue = (value: number) =>
    DIRECTION_CATEGORIES.find(
      (c) =>
        (c.key === "wealth" && value === 6) ||
        (c.key === "luck" && value === 7) ||
        (c.key === "success" && value === 9),
    );

  // Compass-rose star: long cardinal points, short diagonal points.
  const star: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    star.push(pos(i * 45, i % 2 === 0 ? 60 : 40));
    star.push(pos(i * 45 + 22.5, 16));
  }
  const starPoints = star.map((p) => p.join(",")).join(" ");

  const renderNode = (name: string, x: number, y: number) => {
    const value = values[name];
    // The center (中) is never treated as a pick, even if it's 6/7/9.
    const cat = name === "中" ? undefined : catForValue(value);
    const on = !!cat;
    return (
      <g key={name}>
        <circle
          cx={x}
          cy={y}
          r={20}
          strokeWidth={on ? 2.5 : 1.5}
          style={{
            fill: on ? "var(--compass-node-on)" : "var(--compass-node)",
            stroke: on ? cat!.color : "var(--compass-node-edge)",
          }}
        />
        {/* direction name (small, top) */}
        <text
          x={x}
          y={y - 4}
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          style={{ fill: on ? "var(--compass-text-on)" : "var(--compass-text)" }}
        >
          {name}
        </text>
        {/* the computed value (larger, bottom) — coloured if it's a pick */}
        <text
          x={x}
          y={y + 11}
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          style={{ fill: on ? cat!.color : "var(--compass-text)" }}
        >
          {Number.isNaN(value) ? "–" : value}
        </text>
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 250 250" className="w-full max-w-[230px]">
        {/* dial rings */}
        <circle cx={cx} cy={cy} r={118} strokeWidth={2} style={{ fill: "var(--compass-dial)", stroke: "var(--compass-ring)" }} />
        <circle cx={cx} cy={cy} r={113} fill="none" strokeWidth={1} style={{ stroke: "var(--compass-ring-soft)" }} />

        {/* tick marks */}
        {Array.from({ length: 16 }).map((_, i) => {
          const deg = i * 22.5;
          const long = i % 2 === 0;
          const [x1, y1] = pos(deg, 112);
          const [x2, y2] = pos(deg, long ? 102 : 106);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={long ? 1.6 : 1} style={{ stroke: "var(--compass-tick)" }} />
          );
        })}

        {/* compass rose */}
        <polygon points={starPoints} strokeWidth={0.8} opacity={0.9} style={{ fill: "var(--compass-rose)", stroke: "var(--compass-rose-edge)" }} />
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

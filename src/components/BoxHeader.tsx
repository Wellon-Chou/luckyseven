import { type ReactNode } from "react";

// Card header: a rounded badge (number/key) next to a descriptive title.
// Pass `accentColor` to colour-code the badge + title (used by the compass cards).
export function BoxHeader({
  badge,
  title,
  accentColor,
  titleColor,
}: {
  badge: ReactNode;
  title: ReactNode;
  accentColor?: string;
  titleColor?: string;
}) {
  const titleStyle = titleColor
    ? { color: titleColor }
    : accentColor
      ? { color: accentColor }
      : undefined;
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 min-w-9 items-center justify-center rounded-full bg-amber-200 px-2.5 text-lg font-bold text-amber-800"
        style={accentColor ? { backgroundColor: accentColor, color: "#ffffff" } : undefined}
      >
        {badge}
      </span>
      {title ? (
        <span className="text-base font-semibold text-amber-900" style={titleStyle}>
          {title}
        </span>
      ) : null}
    </div>
  );
}

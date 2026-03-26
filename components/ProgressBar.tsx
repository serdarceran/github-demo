interface Props {
  value: number;   // 0-100
  color?: "sky" | "green" | "amber" | "red";
  size?: "sm" | "md";
  label?: string;
  showPercent?: boolean;
  expectedAt?: number; // 0-100, shows a marker where progress should be by now
}

const colorMap = {
  sky: "bg-sky-500",
  green: "bg-emerald-500",
  amber: "bg-amber-400",
  red: "bg-red-500",
};

export default function ProgressBar({
  value,
  color = "sky",
  size = "md",
  label,
  showPercent = true,
  expectedAt,
}: Props) {
  const clamped = Math.min(100, Math.max(0, value));
  const bar = colorMap[color];
  const height = size === "sm" ? "h-1.5" : "h-2.5";
  const expectedClamped = expectedAt !== undefined
    ? Math.min(100, Math.max(0, expectedAt))
    : undefined;

  return (
    <div className="t-progress-bar w-full">
      {(label || showPercent) && (
        <div className="t-progress-bar-header flex justify-between items-center mb-1">
          {label && <span className="t-progress-bar-label text-xs text-gray-500">{label}</span>}
          {showPercent && (
            <span className="t-progress-bar-percent text-xs font-medium text-gray-700 ml-auto">{clamped}%</span>
          )}
        </div>
      )}
      <div className={`t-progress-bar-track w-full bg-gray-200 rounded-full ${height} overflow-visible relative`}>
        <div
          className={`t-progress-bar-fill ${bar} ${height} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
        {expectedClamped !== undefined && (
          <div
            className="t-progress-bar-expected-marker absolute top-1/2 -translate-y-1/2"
            style={{ left: `${expectedClamped}%`, transform: "translateX(-50%) translateY(-50%)" }}
            title={`Expected: ${Math.round(expectedClamped)}%`}
          >
            {/* tick line — extends above and below the track */}
            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gray-600 rounded-full"
              style={{ top: "-5px", height: "calc(100% + 10px)", position: "absolute" }}
            />
            {/* downward triangle above the track */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{ top: "-10px" }}
            >
              <svg width="8" height="6" viewBox="0 0 8 6" className="block">
                <polygon points="4,6 0,0 8,0" className="fill-gray-600" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

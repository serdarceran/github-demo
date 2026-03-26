interface Props {
  value: number;   // 0-100
  color?: "sky" | "green" | "amber" | "red";
  size?: "sm" | "md";
  label?: string;
  showPercent?: boolean;
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
}: Props) {
  const clamped = Math.min(100, Math.max(0, value));
  const bar = colorMap[color];
  const height = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-gray-500">{label}</span>}
          {showPercent && (
            <span className="text-xs font-medium text-gray-700 ml-auto">{clamped}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${bar} ${height} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

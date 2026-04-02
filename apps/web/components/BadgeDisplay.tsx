import { Goal } from "@goal-tracker/types";

interface Props {
  goal: Goal;
  size?: "sm" | "lg";
}

export default function BadgeDisplay({ goal, size = "lg" }: Props) {
  if (goal.status !== "completed") return null;

  if (size === "sm") {
    return (
      <span className="t-badge-sm inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
        🏅 {goal.badgeName}
      </span>
    );
  }

  return (
    <div className="t-badge-lg bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 rounded-xl p-5 text-center">
      <div className="t-badge-icon text-4xl mb-2">🏅</div>
      <div className="t-badge-name font-bold text-amber-800 text-lg">{goal.badgeName}</div>
      <div className="t-badge-subtitle text-amber-600 text-sm mt-1">Earned for completing "{goal.name}"</div>
    </div>
  );
}

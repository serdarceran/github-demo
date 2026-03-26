export type Difficulty = "easy" | "medium" | "hard";
export type GoalStatus = "active" | "completed" | "failed";

export interface DailyLog {
  date: string;      // YYYY-MM-DD
  value: number;     // amount the user logged
  required: number;  // amount required that day (may be doubled from penalty)
  missed: boolean;   // true if value < required
}

export interface Goal {
  id: string;
  name: string;
  unit: string;
  dailyTarget: number;
  difficulty: Difficulty;
  badgeName: string;
  startDate: string;         // YYYY-MM-DD (1st of goal month)
  endDate: string;           // YYYY-MM-DD (last day of goal month)
  status: GoalStatus;
  logs: DailyLog[];
  cumulativeTotal: number;   // sum of all logged values
  totalDebt: number;         // sum of shortfalls from missed days
  nextDayMultiplier: number; // 1 normally, 2 after a missed day
  streak: number;            // consecutive days meeting the target
  createdAt: string;         // ISO timestamp
}

export interface AppState {
  username: string;
  goals: Goal[];
}

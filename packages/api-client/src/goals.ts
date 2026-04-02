import type { Goal } from "@goal-tracker/types";
import type { ApiClient } from "./client";

export interface CreateGoalBody {
  name: string;
  unit: string;
  dailyTarget: number;
  difficulty: "easy" | "medium" | "hard";
  badgeName: string;
}

export interface LogProgressBody {
  value: number;
  date?: string;
}

export function createGoalsApi(client: ApiClient) {
  return {
    list(): Promise<Goal[]> {
      return client.get<Goal[]>("/api/goals");
    },
    get(id: string): Promise<Goal> {
      return client.get<Goal>(`/api/goals/${id}`);
    },
    create(body: CreateGoalBody): Promise<Goal> {
      return client.post<Goal>("/api/goals", body);
    },
    logProgress(id: string, body: LogProgressBody): Promise<Goal> {
      return client.post<Goal>(`/api/goals/${id}/log`, body);
    },
    delete(id: string): Promise<void> {
      return client.delete<void>(`/api/goals/${id}`);
    },
  };
}

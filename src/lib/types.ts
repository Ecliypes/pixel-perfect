export type Result = "win" | "loss" | "draw";

export interface Match {
  id: string;
  game: "valorant";
  map: string;
  agent: string;
  roundsWon: number;
  roundsLost: number;
  kills: number;
  deaths: number;
  assists: number;
  headshotPct: number;
  acs: number;
  date: string; // ISO
  atkWon?: number;
  atkPlayed?: number;
  defWon?: number;
  defPlayed?: number;
  notes?: string;
  demo: boolean;
}

export type GoalMetric = "hs" | "kd" | "acs" | "map_winrate" | "rank";

export interface Goal {
  id: string;
  title: string;
  metric: GoalMetric;
  target: number; // for rank: rank index
  map?: string;
  completed: boolean;
  createdAt: string;
}

export interface Profile {
  username: string;
  tag: string;
  rank: string;
  rr: number;
}

export interface AppState {
  matches: Match[];
  goals: Goal[];
  profile: Profile;
}

export function resultOf(m: Pick<Match, "roundsWon" | "roundsLost">): Result {
  if (m.roundsWon > m.roundsLost) return "win";
  if (m.roundsWon < m.roundsLost) return "loss";
  return "draw";
}

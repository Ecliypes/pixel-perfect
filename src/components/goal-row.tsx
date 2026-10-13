import { Check } from "lucide-react";
import { Bar } from "@/components/kit";
import { RANKS } from "@/lib/constants";
import { fmt, goalProgress } from "@/lib/stats";
import type { Goal, Match, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function formatGoalValue(g: Goal, v: number | null) {
  if (v == null) return "—";
  if (g.metric === "rank") return RANKS[Math.round(v)] ?? "—";
  if (g.metric === "kd") return fmt.kd(v);
  if (g.metric === "acs") return fmt.int(v);
  return fmt.pct(v);
}

export function GoalProgress({ goal, matches, profile, compact }: { goal: Goal; matches: Match[]; profile: Profile; compact?: boolean }) {
  const p = goalProgress(goal, matches, profile);
  return (
    <div className={cn("min-w-0", goal.completed && "opacity-60")}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className={cn("flex min-w-0 items-center gap-1.5 truncate text-[13px]", goal.completed && "line-through")}>
          {goal.completed && <Check className="h-3.5 w-3.5 shrink-0 text-positive" />}
          {goal.title}
        </span>
        <span className="tabular shrink-0 text-[12px] text-muted-foreground">
          {formatGoalValue(goal, p.current)} <span className="text-subtle">/ {formatGoalValue(goal, goal.target)}</span>
        </span>
      </div>
      <Bar pct={goal.completed ? 100 : p.pct} tone={goal.completed || p.met ? "positive" : "primary"} />
      {!compact && p.met && !goal.completed && <div className="mt-1.5 text-[11.5px] text-positive">Target reached — mark it complete when you're confident it's consistent.</div>}
    </div>
  );
}

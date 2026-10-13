import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/kit";
import { MAPS, RANKS } from "@/lib/constants";
import { actions } from "@/lib/store";
import type { Goal, GoalMetric } from "@/lib/types";

export const METRIC_LABEL: Record<GoalMetric, string> = {
  hs: "Headshot % (last 20)",
  kd: "K/D ratio (last 20)",
  acs: "Average combat score (last 20)",
  map_winrate: "Win rate on a map",
  rank: "Reach a rank",
};

export function GoalFormDialog({ open, onOpenChange, goal }: { open: boolean; onOpenChange: (o: boolean) => void; goal?: Goal }) {
  const [metric, setMetric] = useState<GoalMetric>("hs");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [map, setMap] = useState("");
  const [rank, setRank] = useState(RANKS[15]);
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setMetric(goal?.metric ?? "hs");
    setTitle(goal?.title ?? "");
    setTarget(goal && goal.metric !== "rank" ? String(goal.target) : "");
    setMap(goal?.map ?? "");
    setRank(goal?.metric === "rank" ? RANKS[goal.target] : RANKS[15]);
    setErr({});
  }, [open, goal]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    let t = Number(target);
    if (metric === "rank") t = RANKS.indexOf(rank);
    else if (target.trim() === "" || !isFinite(t) || t <= 0) errs.target = "Enter a positive target value";
    else if ((metric === "hs" || metric === "map_winrate") && t > 100) errs.target = "Percentages can't exceed 100";
    else if (metric === "kd" && t > 5) errs.target = "A K/D above 5 isn't a realistic target";
    if (metric === "map_winrate" && !map) errs.map = "Choose a map";
    if (title.trim().length > 60) errs.title = "Keep it under 60 characters";
    if (Object.keys(errs).length) return setErr(errs);

    const auto =
      metric === "rank" ? `Reach ${rank}` :
      metric === "map_winrate" ? `${t}% win rate on ${map}` :
      metric === "kd" ? `${t.toFixed(2)} K/D` :
      metric === "acs" ? `${t} average ACS` : `${t}% headshot rate`;
    const data = { title: title.trim() || auto, metric, target: t, map: metric === "map_winrate" ? map : undefined };
    if (goal) actions.updateGoal(goal.id, data);
    else actions.addGoal(data);
    toast.success(goal ? "Goal updated" : "Goal created");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border-strong bg-popover sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[16px]">{goal ? "Edit goal" : "New goal"}</DialogTitle>
          <DialogDescription className="text-[12.5px]">Progress is calculated from your logged matches.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <label>
            <span className="mb-1 block text-[12px] text-muted-foreground">What to improve</span>
            <NativeSelect className="h-9 w-full" value={metric} onChange={(e) => setMetric(e.target.value as GoalMetric)}>
              {(Object.keys(METRIC_LABEL) as GoalMetric[]).map((k) => <option key={k} value={k}>{METRIC_LABEL[k]}</option>)}
            </NativeSelect>
          </label>
          {metric === "map_winrate" && (
            <label>
              <span className="mb-1 block text-[12px] text-muted-foreground">Map</span>
              <NativeSelect className="h-9 w-full" value={map} onChange={(e) => setMap(e.target.value)}>
                <option value="">Select map</option>
                {MAPS.map((m) => <option key={m}>{m}</option>)}
              </NativeSelect>
              {err.map && <span className="mt-1 block text-[11.5px] text-negative">{err.map}</span>}
            </label>
          )}
          {metric === "rank" ? (
            <label>
              <span className="mb-1 block text-[12px] text-muted-foreground">Target rank</span>
              <NativeSelect className="h-9 w-full" value={rank} onChange={(e) => setRank(e.target.value)}>
                {RANKS.map((r) => <option key={r}>{r}</option>)}
              </NativeSelect>
            </label>
          ) : (
            <label>
              <span className="mb-1 block text-[12px] text-muted-foreground">Target</span>
              <Input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={metric === "kd" ? "1.20" : metric === "acs" ? "250" : "25"} aria-invalid={!!err.target} />
              {err.target && <span className="mt-1 block text-[11.5px] text-negative">{err.target}</span>}
            </label>
          )}
          <label>
            <span className="mb-1 block text-[12px] text-muted-foreground">Label <span className="text-subtle">— optional</span></span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Generated from target if empty" aria-invalid={!!err.title} />
            {err.title && <span className="mt-1 block text-[11.5px] text-negative">{err.title}</span>}
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{goal ? "Save" : "Create goal"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

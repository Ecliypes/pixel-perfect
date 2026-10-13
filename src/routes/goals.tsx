import { createFileRoute } from "@tanstack/react-router";
import { Check, Flag, MoreHorizontal, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GoalFormDialog, METRIC_LABEL } from "@/components/goal-form";
import { GoalProgress } from "@/components/goal-row";
import { Empty, PageHeader } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { actions, useAppState } from "@/lib/store";
import type { Goal } from "@/lib/types";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Goals — Diff" },
      { name: "description", content: "Set and track personal Valorant improvement goals." },
      { property: "og:title", content: "Goals — Diff" },
      { property: "og:description", content: "Set and track personal Valorant improvement goals." },
    ],
  }),
  component: Goals,
});

function Goals() {
  const { goals, matches, profile, ready } = useAppState();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | undefined>();
  const active = goals.filter((g) => !g.completed);
  const done = goals.filter((g) => g.completed);

  const openNew = () => { setEditing(undefined); setOpen(true); };

  const Row = ({ g }: { g: Goal }) => (
    <div className="flex items-center gap-4 px-4 py-4">
      <button
        aria-label={g.completed ? "Mark as active" : "Mark complete"}
        onClick={() => { actions.updateGoal(g.id, { completed: !g.completed }); toast.success(g.completed ? "Goal reopened" : "Goal completed"); }}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors ${g.completed ? "border-positive bg-positive/15 text-positive" : "border-border-strong text-transparent hover:text-muted-foreground"}`}
      >
        <Check className="h-3 w-3" strokeWidth={2.5} />
      </button>
      <div className="min-w-0 flex-1">
        <GoalProgress goal={g} matches={matches} profile={profile} />
        <div className="mt-1.5 text-[11.5px] text-subtle">{METRIC_LABEL[g.metric]}{g.map ? ` · ${g.map}` : ""}</div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button aria-label="Goal options" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="border-border-strong bg-popover">
          <DropdownMenuItem onClick={() => { setEditing(g); setOpen(true); }}><Pencil className="h-3.5 w-3.5" />Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => actions.updateGoal(g.id, { completed: !g.completed })}>
            {g.completed ? <><RotateCcw className="h-3.5 w-3.5" />Reopen</> : <><Check className="h-3.5 w-3.5" />Complete</>}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-negative focus:text-negative" onClick={() => { actions.deleteGoal(g.id); toast.success("Goal deleted"); }}><Trash2 className="h-3.5 w-3.5" />Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (!ready) return <div className="h-96" />;

  return (
    <>
      <PageHeader
        title="Goals"
        sub="Progress updates automatically from your last 20 logged matches and current rank."
        actions={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4" />New goal</Button>}
      />
      {!goals.length ? (
        <div className="panel"><Empty icon={<Flag className="h-4 w-4" />} title="No goals yet" body="Pick one thing to work on — a headshot target, a map, a rank — and track it here." action={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4" />Create a goal</Button>} /></div>
      ) : (
        <div className="grid gap-6">
          <section>
            <div className="eyebrow mb-2">Active · {active.length}</div>
            <div className="panel divide-y divide-border">
              {active.length ? active.map((g) => <Row key={g.id} g={g} />) : <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">Everything's complete. Set a new target.</p>}
            </div>
          </section>
          {!!done.length && (
            <section>
              <div className="eyebrow mb-2">Completed · {done.length}</div>
              <div className="panel divide-y divide-border">{done.map((g) => <Row key={g.id} g={g} />)}</div>
            </section>
          )}
        </div>
      )}
      <GoalFormDialog open={open} onOpenChange={setOpen} goal={editing} />
    </>
  );
}

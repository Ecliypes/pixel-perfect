import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Delta, Panel, ResultTag, SampleTag } from "@/components/kit";
import { MatchFormDialog } from "@/components/match-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { actions, useAppState } from "@/lib/store";
import { fmt, summarize } from "@/lib/stats";
import { resultOf } from "@/lib/types";

export const Route = createFileRoute("/matches/$id")({
  head: () => ({
    meta: [
      { title: "Match details — Diff" },
      { name: "description", content: "Detailed breakdown of a logged Valorant match." },
      { property: "og:title", content: "Match details — Diff" },
      { property: "og:description", content: "Detailed breakdown of a logged Valorant match." },
    ],
  }),
  component: MatchDetail,
});

function MatchDetail() {
  const { id } = Route.useParams();
  const { matches, ready } = useAppState();
  const nav = useNavigate();
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const m = matches.find((x) => x.id === id);

  if (!ready) return <div className="h-96" />;
  if (!m)
    return (
      <div className="panel py-16 text-center">
        <p className="text-[14px] font-medium">Match not found</p>
        <p className="mt-1 text-[13px] text-muted-foreground">It may have been deleted.</p>
        <Link to="/matches" className="mt-4 inline-block text-[13px] font-medium hover:underline">Back to match history</Link>
      </div>
    );

  const rounds = m.roundsWon + m.roundsLost;
  const others = matches.filter((x) => x.id !== m.id);
  const avg = summarize(others);
  const avgMap = summarize(others.filter((x) => x.map === m.map));
  const kd = m.kills / Math.max(1, m.deaths);
  const rows = [
    { label: "K/D", v: kd.toFixed(2), d: avg.kd != null ? kd - avg.kd : null, digits: 2, avg: fmt.kd(avg.kd) },
    { label: "Combat score", v: String(m.acs), d: avg.acs != null ? m.acs - avg.acs : null, digits: 0, avg: fmt.int(avg.acs) },
    { label: "Headshot %", v: m.headshotPct.toFixed(1) + "%", d: avg.hs != null ? m.headshotPct - avg.hs : null, digits: 1, unit: "%", avg: fmt.pct(avg.hs) },
    { label: "Kills / round", v: (m.kills / rounds).toFixed(2), d: null, digits: 2, avg: avg.n ? (avg.kills / others.reduce((s, x) => s + x.roundsWon + x.roundsLost, 0)).toFixed(2) : "—" },
    { label: "Deaths / round", v: (m.deaths / rounds).toFixed(2), d: null, digits: 2, avg: avg.n ? (avg.deaths / others.reduce((s, x) => s + x.roundsWon + x.roundsLost, 0)).toFixed(2) : "—" },
  ];

  return (
    <>
      <Link to="/matches" className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />Match history
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{m.map}</h1>
            <ResultTag r={resultOf(m)} />
            {m.demo && <SampleTag />}
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">{m.agent} · {format(new Date(m.date), "EEEE, MMM d yyyy · HH:mm")}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEdit(true)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
          <Button size="sm" variant="outline" onClick={() => setDel(true)} className="text-negative hover:text-negative"><Trash2 className="h-3.5 w-3.5" />Delete</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="grid content-start gap-4">
          <div className="panel p-5">
            <div className="eyebrow">Final score</div>
            <div className="tabular mt-2 text-[40px] font-semibold leading-none tracking-[-0.03em]">
              <span className={resultOf(m) === "win" ? "text-positive" : resultOf(m) === "loss" ? "text-negative" : ""}>{m.roundsWon}</span>
              <span className="mx-2 text-subtle">–</span>
              <span className="text-muted-foreground">{m.roundsLost}</span>
            </div>
            <div className="mt-5 grid grid-cols-3 border-t border-border pt-4 text-center">
              {[["Kills", m.kills], ["Deaths", m.deaths], ["Assists", m.assists]].map(([l, v]) => (
                <div key={l}><div className="tabular text-[20px] font-semibold">{v}</div><div className="eyebrow mt-0.5">{l}</div></div>
              ))}
            </div>
          </div>
          <Panel title="Side breakdown">
            {m.atkPlayed && m.defPlayed ? (
              <div className="grid gap-3">
                {[["Attack", m.atkWon ?? 0, m.atkPlayed], ["Defense", m.defWon ?? 0, m.defPlayed]].map(([l, w, p]) => (
                  <div key={l as string}>
                    <div className="mb-1 flex justify-between text-[13px]"><span>{l}</span><span className="tabular text-muted-foreground">{w} / {p} rounds</span></div>
                    <div className="flex h-1.5 gap-px overflow-hidden rounded-full">
                      {Array.from({ length: p as number }).map((_, i) => <div key={i} className={i < (w as number) ? "flex-1 bg-chart-2" : "flex-1 bg-muted"} />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">No side data recorded. Edit the match to add attack/defense rounds won.</p>
            )}
          </Panel>
          {m.notes && <Panel title="Notes"><p className="text-[13px] text-muted-foreground">{m.notes}</p></Panel>}
        </div>

        <Panel title="Compared with your average" bodyClass="p-0">
          <table className="w-full text-[13px]">
            <thead className="border-b border-border text-left text-[12px] text-subtle">
              <tr><th className="px-4 py-2.5 font-normal">Stat</th><th className="px-4 font-normal text-right">This match</th><th className="px-4 font-normal text-right">Avg ({avg.n})</th><th className="px-4 font-normal text-right">Diff</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="px-4 py-3 text-muted-foreground">{r.label}</td>
                  <td className="tabular px-4 text-right font-medium">{r.v}</td>
                  <td className="tabular px-4 text-right text-muted-foreground">{r.avg}</td>
                  <td className="px-4 text-right">{r.d != null ? <Delta value={r.d} digits={r.digits} unit={r.unit} /> : <span className="text-subtle">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border px-4 py-3 text-[12.5px] text-muted-foreground">
            On {m.map} you've played {avgMap.n} other {avgMap.n === 1 ? "match" : "matches"}
            {avgMap.n ? <> at {fmt.pct(avgMap.winRate, 0)} win rate and {fmt.kd(avgMap.kd)} K/D.</> : "."}
          </div>
        </Panel>
      </div>

      <MatchFormDialog open={edit} onOpenChange={setEdit} match={m} />
      <AlertDialog open={del} onOpenChange={setDel}>
        <AlertDialogContent className="border-border-strong bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this match?</AlertDialogTitle>
            <AlertDialogDescription>{m.map} · {m.agent} · {m.kills}/{m.deaths}/{m.assists}. All stats and charts will be recalculated. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { actions.deleteMatch(m.id); toast.success("Match deleted"); nav({ to: "/matches" }); }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

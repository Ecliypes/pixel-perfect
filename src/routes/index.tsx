import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowRight, Flag, Plus, Swords } from "lucide-react";
import { useMemo, useState } from "react";
import { TrendChart } from "@/components/charts";
import { GoalProgress } from "@/components/goal-row";
import { Delta, DemoNotice, Empty, PageHeader, Panel, ResultTag, SampleTag } from "@/components/kit";
import { MatchFormDialog } from "@/components/match-form";
import { Button } from "@/components/ui/button";
import { actions, useAppState } from "@/lib/store";
import { byDateDesc, fmt, groupBy, series, summarize } from "@/lib/stats";
import { resultOf } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — Diff" },
      { name: "description", content: "Your recent Valorant form at a glance: rank, win rate, K/D, headshot rate and trends." },
      { property: "og:title", content: "Overview — Diff" },
      { property: "og:description", content: "Your recent Valorant form at a glance." },
    ],
  }),
  component: Overview,
});

function Metric({ label, value, delta, sub }: { label: string; value: string; delta?: React.ReactNode; sub?: string }) {
  return (
    <div className="px-4 py-3.5">
      <div className="eyebrow">{label}</div>
      <div className="tabular mt-1.5 text-[22px] font-semibold tracking-[-0.02em]">{value}</div>
      <div className="mt-0.5 flex h-4 items-center gap-1.5">
        {delta}
        {sub && <span className="text-[11px] text-subtle">{sub}</span>}
      </div>
    </div>
  );
}

function Overview() {
  const { matches, goals, profile, ready } = useAppState();
  const [open, setOpen] = useState(false);
  const sorted = useMemo(() => [...matches].sort(byDateDesc), [matches]);
  const cur = summarize(sorted.slice(0, 20));
  const prev = summarize(sorted.slice(20, 40));
  const d = (a: number | null, b: number | null) => (a != null && b != null && prev.n ? a - b : null);
  const trend = useMemo(() => series(sorted.slice(0, 30), 5), [sorted]);
  const maps = groupBy(sorted, "map").filter((m) => m.n >= 2).sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));
  const demoCount = matches.filter((m) => m.demo).length;
  const activeGoals = goals.filter((g) => !g.completed).slice(0, 4);

  if (!ready) return <div className="h-96" />;

  return (
    <>
      <PageHeader
        title="Overview"
        sub={matches.length ? `Last ${Math.min(20, cur.n)} matches compared with the ${prev.n || "no"} before` : "Log your first match to start tracking."}
        actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Log match</Button>}
      />
      <DemoNotice count={demoCount} onClear={actions.clearDemo} />

      {!matches.length ? (
        <div className="panel">
          <Empty
            icon={<Swords className="h-4 w-4" />}
            title="No matches yet"
            body="Diff builds every chart and stat from matches you log. Copy the numbers from your end-of-game scoreboard to get started."
            action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Log your first match</Button>}
          />
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="panel grid grid-cols-2 divide-border sm:grid-cols-3 lg:grid-cols-5 lg:divide-x [&>*]:border-border max-lg:[&>*]:border-b">
            <div className="col-span-2 flex items-center gap-3 px-4 py-3.5 sm:col-span-1">
              <div>
                <div className="eyebrow">Current rank</div>
                <div className="mt-1.5 text-[18px] font-semibold tracking-[-0.01em]">{profile.rank}</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 w-20 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${profile.rr}%` }} /></div>
                  <span className="tabular text-[11px] text-muted-foreground">{profile.rr} RR</span>
                </div>
              </div>
            </div>
            <Metric label="Win rate" value={fmt.pct(cur.winRate, 0)} delta={<Delta value={d(cur.winRate, prev.winRate)} unit="%" digits={0} />} sub={`${cur.wins}W ${cur.losses}L`} />
            <Metric label="K/D" value={fmt.kd(cur.kd)} delta={<Delta value={d(cur.kd, prev.kd)} digits={2} />} />
            <Metric label="Headshot" value={fmt.pct(cur.hs)} delta={<Delta value={d(cur.hs, prev.hs)} unit="%" />} />
            <Metric label="Avg combat score" value={fmt.int(cur.acs)} delta={<Delta value={d(cur.acs, prev.acs)} digits={0} />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <Panel
              title="Form — rolling 5-match average"
              action={<Link to="/performance" className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">Performance <ArrowRight className="h-3 w-3" /></Link>}
            >
              {trend.length >= 2 ? (
                <TrendChart
                  data={trend}
                  height={230}
                  reference={1}
                  lines={[
                    { key: "kd", name: "Match K/D", color: "var(--color-chart-5)", dashed: true, dots: true },
                    { key: "kdAvg", name: "K/D (5-avg)", color: "var(--color-primary)" },
                  ]}
                />
              ) : (
                <p className="py-16 text-center text-[13px] text-muted-foreground">Log at least two matches to see a trend.</p>
              )}
            </Panel>

            <Panel title="Maps" action={<Link to="/maps" className="text-[12px] text-muted-foreground hover:text-foreground">All maps</Link>} bodyClass="p-0">
              {maps.length < 2 ? (
                <p className="p-4 text-[13px] text-muted-foreground">Play at least 2 matches on two different maps to compare them.</p>
              ) : (
                <div className="divide-y divide-border">
                  {[{ label: "Strongest", list: maps.slice(0, 2), tone: "text-positive" }, { label: "Weakest", list: maps.slice(-2).reverse(), tone: "text-negative" }].map((grp) => (
                    <div key={grp.label} className="px-4 py-3">
                      <div className="eyebrow mb-2">{grp.label}</div>
                      {grp.list.map((m) => (
                        <div key={m.name} className="flex items-center justify-between py-1 text-[13px]">
                          <span>{m.name}</span>
                          <span className="tabular flex items-center gap-3 text-[12px]">
                            <span className="text-subtle">{m.n} games</span>
                            <span className="text-muted-foreground">{fmt.kd(m.kd)} K/D</span>
                            <span className={`w-10 text-right font-medium ${grp.tone}`}>{fmt.pct(m.winRate, 0)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <Panel title="Recent matches" action={<Link to="/matches" className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">Match history <ArrowRight className="h-3 w-3" /></Link>} bodyClass="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <tbody className="divide-y divide-border">
                    {sorted.slice(0, 6).map((m) => (
                      <tr key={m.id} className="transition-colors hover:bg-accent/40">
                        <td className="py-2.5 pl-4 pr-2">
                          <Link to="/matches/$id" params={{ id: m.id }} className="block"><ResultTag r={resultOf(m)} score={`${m.roundsWon}–${m.roundsLost}`} /></Link>
                        </td>
                        <td className="px-2"><span className="font-medium">{m.map}</span> <span className="text-muted-foreground">· {m.agent}</span></td>
                        <td className="tabular px-2 text-muted-foreground">{m.kills}/{m.deaths}/{m.assists}</td>
                        <td className="tabular px-2 text-muted-foreground">{m.acs} ACS</td>
                        <td className="whitespace-nowrap py-2.5 pl-2 pr-4 text-right text-[12px] text-subtle">
                          <span className="inline-flex items-center gap-2">{m.demo && <SampleTag />}{formatDistanceToNowStrict(new Date(m.date), { addSuffix: true })}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title="Goals" action={<Link to="/goals" className="text-[12px] text-muted-foreground hover:text-foreground">Manage</Link>}>
              {activeGoals.length ? (
                <div className="grid gap-4">
                  {activeGoals.map((g) => <GoalProgress key={g.id} goal={g} matches={matches} profile={profile} compact />)}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <Flag className="mx-auto mb-2 h-4 w-4 text-subtle" />
                  <p className="text-[13px] text-muted-foreground">No active goals.</p>
                  <Link to="/goals" className="mt-1 inline-block text-[12.5px] font-medium text-foreground hover:underline">Set one</Link>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}
      <MatchFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

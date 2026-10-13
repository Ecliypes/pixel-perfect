import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { useMemo, useState } from "react";
import { HBarChart, TrendChart } from "@/components/charts";
import { DemoNotice, Empty, PageHeader, Panel } from "@/components/kit";
import { actions, useAppState } from "@/lib/store";
import { byDateDesc, fmt, groupBy, series, summarize } from "@/lib/stats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Performance — Diff" },
      { name: "description", content: "K/D, headshot and win rate trends plus breakdowns by map, agent and side." },
      { property: "og:title", content: "Performance — Diff" },
      { property: "og:description", content: "Trends and breakdowns derived from your logged matches." },
    ],
  }),
  component: Performance,
});

const RANGES = [
  { id: "recent", label: "Last 20" },
  { id: "30d", label: "30 days" },
  { id: "all", label: "All" },
] as const;
type RangeId = (typeof RANGES)[number]["id"];

function Performance() {
  const { matches, ready } = useAppState();
  const [range, setRange] = useState<RangeId>("recent");

  const list = useMemo(() => {
    const sorted = [...matches].sort(byDateDesc);
    if (range === "recent") return sorted.slice(0, 20);
    if (range === "30d") { const cut = Date.now() - 30 * 864e5; return sorted.filter((m) => +new Date(m.date) >= cut); }
    return sorted;
  }, [matches, range]);

  const data = useMemo(() => series(list, 5), [list]);
  const s = summarize(list);
  const maps = groupBy(list, "map");
  const agents = groupBy(list, "agent");

  if (!ready) return <div className="h-96" />;

  return (
    <>
      <PageHeader
        title="Performance"
        sub={`${list.length} matches in range · lines show a rolling 5-match average`}
        actions={
          <div className="flex rounded-md border border-border p-0.5">
            {RANGES.map((r) => (
              <button key={r.id} onClick={() => setRange(r.id)} className={cn("rounded-[5px] px-3 py-1 text-[12.5px] transition-colors", range === r.id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {r.label}
              </button>
            ))}
          </div>
        }
      />
      <DemoNotice count={matches.filter((m) => m.demo).length} onClear={actions.clearDemo} />

      {list.length < 2 ? (
        <div className="panel"><Empty icon={<BarChart3 className="h-4 w-4" />} title="Not enough data in this range" body="Charts need at least two matches. Log more games or widen the range." /></div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title={<span className="flex items-baseline gap-2">K/D <span className="tabular text-muted-foreground">{fmt.kd(s.kd)}</span></span>}>
              <TrendChart data={data} reference={1} lines={[{ key: "kd", name: "Match", color: "var(--color-chart-5)", dashed: true, dots: true }, { key: "kdAvg", name: "5-avg", color: "var(--color-primary)" }]} />
            </Panel>
            <Panel title={<span className="flex items-baseline gap-2">Headshot % <span className="tabular text-muted-foreground">{fmt.pct(s.hs)}</span></span>}>
              <TrendChart data={data} unit="%" lines={[{ key: "hs", name: "Match", color: "var(--color-chart-5)", dashed: true, dots: true }, { key: "hsAvg", name: "5-avg", color: "var(--color-chart-2)" }]} />
            </Panel>
            <Panel title={<span className="flex items-baseline gap-2">Win rate <span className="tabular text-muted-foreground">{fmt.pct(s.winRate, 0)}</span></span>}>
              <TrendChart data={data} unit="%" reference={50} domain={[0, 100]} lines={[{ key: "winRateAvg", name: "5-match WR", color: "var(--color-chart-3)" }]} />
            </Panel>
            <Panel title="Attack vs defense" bodyClass="p-0">
              {s.atkRate == null && s.defRate == null ? (
                <p className="p-4 text-[13px] text-muted-foreground">No matches in this range have side data. Add attack/defense rounds won when logging matches.</p>
              ) : (
                <div className="grid h-full grid-cols-2 divide-x divide-border">
                  {[["Attack", s.atkRate], ["Defense", s.defRate]].map(([l, v]) => (
                    <div key={l as string} className="flex flex-col justify-center p-6">
                      <div className="eyebrow">{l} round win rate</div>
                      <div className="tabular mt-2 text-[32px] font-semibold tracking-[-0.03em]">{fmt.pct(v as number | null, 1)}</div>
                      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-chart-2" style={{ width: `${v ?? 0}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <Panel title="Win rate by map">
              <HBarChart data={maps.map((m) => ({ name: m.name, wr: Math.round(m.winRate ?? 0) }))} dataKey="wr" name="Win rate" unit="%" />
            </Panel>
            <Panel title="By agent" bodyClass="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="border-b border-border text-left text-[12px] text-subtle">
                    <tr>{["Agent", "Games", "Win %", "K/D", "HS%", "ACS"].map((h, i) => <th key={h} className={cn("px-4 py-2.5 font-normal", i && "text-right")}>{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {agents.map((a) => (
                      <tr key={a.name}>
                        <td className="px-4 py-2.5 font-medium">{a.name}</td>
                        <td className="tabular px-4 text-right text-muted-foreground">{a.n}</td>
                        <td className="tabular px-4 text-right">{fmt.pct(a.winRate, 0)}</td>
                        <td className="tabular px-4 text-right">{fmt.kd(a.kd)}</td>
                        <td className="tabular px-4 text-right text-muted-foreground">{fmt.pct(a.hs)}</td>
                        <td className="tabular px-4 text-right">{fmt.int(a.acs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}

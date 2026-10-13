import { createFileRoute, Link } from "@tanstack/react-router";
import { Map as MapIcon } from "lucide-react";
import { useMemo } from "react";
import { DemoNotice, Empty, PageHeader } from "@/components/kit";
import { actions, useAppState } from "@/lib/store";
import { fmt, groupBy, summarize } from "@/lib/stats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/maps")({
  head: () => ({
    meta: [
      { title: "Maps — Diff" },
      { name: "description", content: "Win rate, K/D and side performance for every Valorant map you've played." },
      { property: "og:title", content: "Maps — Diff" },
      { property: "og:description", content: "Per-map performance from your logged matches." },
    ],
  }),
  component: Maps,
});

function Maps() {
  const { matches, ready } = useAppState();
  const overall = summarize(matches);
  const maps = useMemo(
    () => groupBy(matches, "map").map((m) => ({ ...m, top: groupBy(matches.filter((x) => x.map === m.name), "agent")[0]?.name })).sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0)),
    [matches],
  );

  if (!ready) return <div className="h-96" />;

  return (
    <>
      <PageHeader title="Maps" sub={matches.length ? `Overall win rate ${fmt.pct(overall.winRate, 0)} · sorted by win rate` : undefined} />
      <DemoNotice count={matches.filter((m) => m.demo).length} onClear={actions.clearDemo} />
      {!maps.length ? (
        <div className="panel"><Empty icon={<MapIcon className="h-4 w-4" />} title="No map data yet" body="Map breakdowns appear once you've logged matches." action={<Link to="/matches" className="text-[13px] font-medium hover:underline">Go to match history</Link>} /></div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead className="border-b border-border text-left text-[12px] text-subtle">
              <tr>
                {["Map", "Games", "Record", "Win rate", "K/D", "HS%", "ACS", "Atk / Def", "Most played"].map((h, i) => (
                  <th key={h} className={cn("px-4 py-2.5 font-normal", i > 0 && i < 8 && "text-right")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {maps.map((m) => {
                const diff = (m.winRate ?? 0) - (overall.winRate ?? 0);
                return (
                  <tr key={m.name} className="hover:bg-accent/30">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="tabular px-4 text-right text-muted-foreground">{m.n}</td>
                    <td className="tabular px-4 text-right text-muted-foreground">{m.wins}–{m.losses}</td>
                    <td className="px-4">
                      <div className="flex items-center justify-end gap-3">
                        <div className="relative h-1 w-20 rounded-full bg-muted">
                          <div className={cn("absolute inset-y-0 left-0 rounded-full", diff >= 0 ? "bg-positive" : "bg-negative")} style={{ width: `${m.winRate ?? 0}%` }} />
                          <div className="absolute -top-1 h-3 w-px bg-foreground/50" style={{ left: `${overall.winRate ?? 0}%` }} />
                        </div>
                        <span className={cn("tabular w-10 text-right font-medium", diff >= 0 ? "text-positive" : "text-negative")}>{fmt.pct(m.winRate, 0)}</span>
                      </div>
                    </td>
                    <td className="tabular px-4 text-right">{fmt.kd(m.kd)}</td>
                    <td className="tabular px-4 text-right text-muted-foreground">{fmt.pct(m.hs)}</td>
                    <td className="tabular px-4 text-right">{fmt.int(m.acs)}</td>
                    <td className="tabular px-4 text-right text-muted-foreground">{fmt.pct(m.atkRate, 0)} / {fmt.pct(m.defRate, 0)}</td>
                    <td className="px-4 text-muted-foreground">{m.top}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-border px-4 py-2.5 text-[11.5px] text-subtle">The tick on each bar marks your overall win rate. Atk / Def shows round win rate per side where recorded.</div>
        </div>
      )}
    </>
  );
}

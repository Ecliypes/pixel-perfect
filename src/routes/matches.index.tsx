import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, ChevronsUpDown, ListFilter, Plus, Swords, X } from "lucide-react";
import { useMemo, useState } from "react";
import { DemoNotice, Empty, NativeSelect, PageHeader, ResultTag, SampleTag } from "@/components/kit";
import { MatchFormDialog } from "@/components/match-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions, useAppState } from "@/lib/store";
import { fmt, summarize } from "@/lib/stats";
import { resultOf, type Match } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/matches/")({
  head: () => ({
    meta: [
      { title: "Match History — Diff" },
      { name: "description", content: "Every logged Valorant match, sortable and filterable by map, agent, result and date." },
      { property: "og:title", content: "Match History — Diff" },
      { property: "og:description", content: "Every logged Valorant match, sortable and filterable." },
    ],
  }),
  component: MatchHistory,
});

type SortKey = "date" | "map" | "agent" | "result" | "kills" | "kd" | "headshotPct" | "acs";
const kd = (m: Match) => m.kills / Math.max(1, m.deaths);
const getters: Record<SortKey, (m: Match) => number | string> = {
  date: (m) => +new Date(m.date), map: (m) => m.map, agent: (m) => m.agent,
  result: (m) => m.roundsWon - m.roundsLost, kills: (m) => m.kills, kd, headshotPct: (m) => m.headshotPct, acs: (m) => m.acs,
};

function MatchHistory() {
  const { matches, ready } = useAppState();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [map, setMap] = useState("");
  const [agent, setAgent] = useState("");
  const [result, setResult] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "date", dir: -1 });

  const mapOpts = useMemo(() => [...new Set(matches.map((m) => m.map))].sort(), [matches]);
  const agentOpts = useMemo(() => [...new Set(matches.map((m) => m.agent))].sort(), [matches]);

  const rows = useMemo(() => {
    const f0 = from ? new Date(from + "T00:00").getTime() : -Infinity;
    const t0 = to ? new Date(to + "T23:59:59").getTime() : Infinity;
    const g = getters[sort.key];
    return matches
      .filter((m) => (!map || m.map === map) && (!agent || m.agent === agent) && (!result || resultOf(m) === result))
      .filter((m) => { const t = +new Date(m.date); return t >= f0 && t <= t0; })
      .sort((a, b) => { const x = g(a), y = g(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; });
  }, [matches, map, agent, result, from, to, sort]);

  const s = summarize(rows);
  const filtered = !!(map || agent || result || from || to);
  const clear = () => { setMap(""); setAgent(""); setResult(""); setFrom(""); setTo(""); };

  const Th = ({ k, children, right }: { k: SortKey; children: string; right?: boolean }) => {
    const active = sort.key === k;
    const Icon = !active ? ChevronsUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
    return (
      <th className={cn("px-3 py-2.5 font-normal", right && "text-right")}>
        <button
          onClick={() => setSort((p) => ({ key: k, dir: p.key === k ? ((-p.dir) as 1 | -1) : k === "map" || k === "agent" ? 1 : -1 }))}
          className={cn("inline-flex items-center gap-1 transition-colors hover:text-foreground", active ? "text-foreground" : "text-subtle")}
        >
          {children}
          <Icon className="h-3 w-3" />
        </button>
      </th>
    );
  };

  if (!ready) return <div className="h-96" />;

  return (
    <>
      <PageHeader
        title="Match History"
        sub={`${matches.length} matches recorded`}
        actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Log match</Button>}
      />
      <DemoNotice count={matches.filter((m) => m.demo).length} onClear={actions.clearDemo} />

      {!matches.length ? (
        <div className="panel"><Empty icon={<Swords className="h-4 w-4" />} title="No matches logged" body="Add matches from your scoreboard and they'll appear here." action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Log match</Button>} /></div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <ListFilter className="mr-1 h-3.5 w-3.5 text-subtle" />
            <NativeSelect value={map} onChange={(e) => setMap(e.target.value)} aria-label="Filter by map">
              <option value="">All maps</option>
              {mapOpts.map((m) => <option key={m}>{m}</option>)}
            </NativeSelect>
            <NativeSelect value={agent} onChange={(e) => setAgent(e.target.value)} aria-label="Filter by agent">
              <option value="">All agents</option>
              {agentOpts.map((a) => <option key={a}>{a}</option>)}
            </NativeSelect>
            <NativeSelect value={result} onChange={(e) => setResult(e.target.value)} aria-label="Filter by result">
              <option value="">Any result</option>
              <option value="win">Wins</option>
              <option value="loss">Losses</option>
              <option value="draw">Draws</option>
            </NativeSelect>
            <div className="flex items-center gap-1.5 text-[12px] text-subtle">
              <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="h-8 w-[138px] text-[12.5px]" aria-label="From date" />
              –
              <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="h-8 w-[138px] text-[12.5px]" aria-label="To date" />
            </div>
            {filtered && (
              <button onClick={clear} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground">
                <X className="h-3 w-3" />Clear
              </button>
            )}
            <div className="tabular ml-auto text-[12px] text-muted-foreground">
              {rows.length} shown · {fmt.pct(s.winRate, 0)} WR · {fmt.kd(s.kd)} K/D
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead className="border-b border-border text-left text-[12px]">
                <tr>
                  <Th k="map">Map</Th>
                  <Th k="result">Result</Th>
                  <Th k="agent">Agent</Th>
                  <Th k="kills" right>K / D / A</Th>
                  <Th k="kd" right>K/D</Th>
                  <Th k="headshotPct" right>HS%</Th>
                  <Th k="acs" right>ACS</Th>
                  <Th k="date" right>Played</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((m) => {
                  const r = kd(m);
                  return (
                    <tr
                      key={m.id}
                      tabIndex={0}
                      onClick={() => nav({ to: "/matches/$id", params: { id: m.id } })}
                      onKeyDown={(e) => e.key === "Enter" && nav({ to: "/matches/$id", params: { id: m.id } })}
                      className="cursor-pointer transition-colors hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none"
                    >
                      <td className="px-3 py-2.5 font-medium"><span className="inline-flex items-center gap-2">{m.map}{m.demo && <SampleTag />}</span></td>
                      <td className="px-3"><ResultTag r={resultOf(m)} score={`${m.roundsWon}–${m.roundsLost}`} /></td>
                      <td className="px-3 text-muted-foreground">{m.agent}</td>
                      <td className="tabular px-3 text-right">{m.kills} <span className="text-subtle">/</span> {m.deaths} <span className="text-subtle">/</span> {m.assists}</td>
                      <td className={cn("tabular px-3 text-right", r >= 1 ? "text-foreground" : "text-muted-foreground")}>{r.toFixed(2)}</td>
                      <td className="tabular px-3 text-right text-muted-foreground">{m.headshotPct.toFixed(1)}</td>
                      <td className="tabular px-3 text-right">{m.acs}</td>
                      <td className="tabular whitespace-nowrap px-3 text-right text-[12px] text-subtle">{format(new Date(m.date), "MMM d, HH:mm")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!rows.length && (
              <div className="py-12 text-center text-[13px] text-muted-foreground">
                No matches fit these filters. <button onClick={clear} className="font-medium text-foreground hover:underline">Clear filters</button>
              </div>
            )}
          </div>
        </div>
      )}
      <MatchFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

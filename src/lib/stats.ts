import { rankIndex } from "./constants";
import type { Goal, Match, Profile } from "./types";
import { resultOf } from "./types";

export const byDateDesc = (a: Match, b: Match) => +new Date(b.date) - +new Date(a.date);

export interface Summary {
  n: number;
  wins: number;
  losses: number;
  winRate: number | null;
  kd: number | null;
  hs: number | null;
  acs: number | null;
  kills: number;
  deaths: number;
  assists: number;
  atkRate: number | null;
  defRate: number | null;
}

export function summarize(ms: Match[]): Summary {
  const n = ms.length;
  let wins = 0, losses = 0, k = 0, d = 0, a = 0, hs = 0, acs = 0;
  let aw = 0, ap = 0, dw = 0, dp = 0;
  for (const m of ms) {
    const r = resultOf(m);
    if (r === "win") wins++;
    if (r === "loss") losses++;
    k += m.kills; d += m.deaths; a += m.assists; hs += m.headshotPct; acs += m.acs;
    if (m.atkPlayed) { aw += m.atkWon ?? 0; ap += m.atkPlayed; }
    if (m.defPlayed) { dw += m.defWon ?? 0; dp += m.defPlayed; }
  }
  return {
    n, wins, losses,
    winRate: n ? (wins / n) * 100 : null,
    kd: n ? k / Math.max(1, d) : null,
    hs: n ? hs / n : null,
    acs: n ? acs / n : null,
    kills: k, deaths: d, assists: a,
    atkRate: ap ? (aw / ap) * 100 : null,
    defRate: dp ? (dw / dp) * 100 : null,
  };
}

export function groupBy(ms: Match[], key: "map" | "agent") {
  const g = new Map<string, Match[]>();
  for (const m of ms) g.set(m[key], [...(g.get(m[key]) ?? []), m]);
  return [...g.entries()].map(([name, list]) => ({ name, ...summarize(list) })).sort((a, b) => b.n - a.n);
}

/** Chronological series with rolling averages, derived from stored records. */
export function series(ms: Match[], window = 5) {
  const asc = [...ms].sort((a, b) => -byDateDesc(a, b));
  return asc.map((m, i) => {
    const slice = asc.slice(Math.max(0, i - window + 1), i + 1);
    const s = summarize(slice);
    return {
      idx: i + 1,
      date: m.date,
      kd: +(m.kills / Math.max(1, m.deaths)).toFixed(2),
      hs: m.headshotPct,
      acs: m.acs,
      kdAvg: +(s.kd ?? 0).toFixed(2),
      hsAvg: +(s.hs ?? 0).toFixed(1),
      acsAvg: Math.round(s.acs ?? 0),
      winRateAvg: Math.round(s.winRate ?? 0),
    };
  });
}

export function goalProgress(g: Goal, matches: Match[], profile: Profile) {
  const recent = [...matches].sort(byDateDesc).slice(0, 20);
  let current: number | null = null;
  let start = 0;
  if (g.metric === "hs") current = summarize(recent).hs;
  if (g.metric === "kd") current = summarize(recent).kd;
  if (g.metric === "acs") current = summarize(recent).acs;
  if (g.metric === "map_winrate") current = summarize(matches.filter((m) => m.map === g.map)).winRate;
  if (g.metric === "rank") { current = rankIndex(profile.rank); start = 0; }
  const pct = current == null ? 0 : Math.max(0, Math.min(100, ((current - start) / Math.max(0.0001, g.target - start)) * 100));
  return { current, pct, met: current != null && current >= g.target };
}

export const fmt = {
  pct: (v: number | null, d = 1) => (v == null ? "—" : `${v.toFixed(d)}%`),
  kd: (v: number | null) => (v == null ? "—" : v.toFixed(2)),
  int: (v: number | null) => (v == null ? "—" : Math.round(v).toString()),
};

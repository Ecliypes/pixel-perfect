import type { AppState, Match } from "./types";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEMO_MAPS = ["Ascent", "Bind", "Haven", "Split", "Lotus", "Sunset", "Icebox"];
const MAP_SKILL: Record<string, number> = { Ascent: 0.12, Bind: 0.05, Haven: 0.08, Split: -0.1, Lotus: 0, Sunset: -0.04, Icebox: -0.14 };
const DEMO_AGENTS = ["Jett", "Jett", "Raze", "Sova", "Omen", "Jett", "Killjoy"];

export function buildDemoState(now = Date.now()): AppState {
  const rand = mulberry32(1337);
  const matches: Match[] = [];
  const total = 42;
  let t = now - 1000 * 60 * 60 * 3;
  for (let i = 0; i < total; i++) {
    const progress = (total - i) / total; // older => higher, so improvement over time
    const map = DEMO_MAPS[Math.floor(rand() * DEMO_MAPS.length)] ?? "Ascent";
    const agent = DEMO_AGENTS[Math.floor(rand() * DEMO_AGENTS.length)] ?? "Jett";
    const skill = 0.5 + (MAP_SKILL[map] ?? 0) - progress * 0.12 + (rand() - 0.5) * 0.5;
    const win = skill > 0.45;
    const loserRounds = Math.floor(rand() * 11) + 2;
    const draw = rand() < 0.03;
    const roundsWon = draw ? 12 : win ? 13 : loserRounds;
    const roundsLost = draw ? 12 : win ? loserRounds : 13;
    const rounds = roundsWon + roundsLost;
    const kpr = 0.62 + skill * 0.35 + (rand() - 0.5) * 0.15;
    const kills = Math.max(4, Math.round(rounds * kpr));
    const deaths = Math.max(6, Math.round(rounds * (0.82 - skill * 0.18 + (rand() - 0.5) * 0.12)));
    const assists = Math.round(rand() * 8) + (agent === "Sova" ? 5 : 1);
    const headshotPct = Math.round((17 + skill * 9 - progress * 3 + rand() * 7) * 10) / 10;
    const acs = Math.round((kills / rounds) * 260 + 25 + rand() * 30);
    const atkPlayed = Math.min(12, Math.ceil(rounds / 2));
    const atkWon = Math.max(0, Math.min(atkPlayed, Math.round(roundsWon * (0.42 + rand() * 0.16))));
    const defPlayed = rounds - atkPlayed;
    const defWon = Math.max(0, Math.min(defPlayed, roundsWon - atkWon));
    matches.push({
      id: `demo-${i}`,
      game: "valorant",
      map, agent, roundsWon, roundsLost: roundsLost, kills, deaths, assists, headshotPct, acs,
      date: new Date(t).toISOString(),
      atkWon, atkPlayed, defWon, defPlayed: defPlayed,
      demo: true,
    });
    t -= 1000 * 60 * 60 * (6 + rand() * 40);
  }
  return {
    matches,
    goals: [
      { id: "demo-g1", title: "Hit 25% headshot rate", metric: "hs", target: 25, completed: false, createdAt: new Date(now).toISOString() },
      { id: "demo-g2", title: "Win more on Split", metric: "map_winrate", target: 55, map: "Split", completed: false, createdAt: new Date(now).toISOString() },
      { id: "demo-g3", title: "Reach Diamond 1", metric: "rank", target: 15, completed: false, createdAt: new Date(now).toISOString() },
    ],
    profile: { username: "kestrel", tag: "EUW", rank: "Platinum 3", rr: 64 },
  };
}

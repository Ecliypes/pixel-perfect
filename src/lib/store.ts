import { useSyncExternalStore } from "react";
import { buildDemoState } from "./demo";
import type { AppState, Goal, Match, Profile } from "./types";

const KEY = "diff:v1";
const EMPTY: AppState = { matches: [], goals: [], profile: { username: "player", tag: "", rank: "Unranked", rr: 0 } };

let state: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as AppState) : buildDemoState();
    if (!raw) localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    state = buildDemoState();
  }
  return state!;
}

function set(next: AppState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or unavailable */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState(): AppState & { ready: boolean } {
  const s = useSyncExternalStore(subscribe, load, () => EMPTY);
  return { ...s, ready: s !== EMPTY };
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const actions = {
  addMatch(m: Omit<Match, "id" | "demo" | "game">) {
    const s = load();
    const match: Match = { ...m, id: uid(), demo: false, game: "valorant" };
    set({ ...s, matches: [match, ...s.matches] });
    return match;
  },
  updateMatch(id: string, patch: Partial<Match>) {
    const s = load();
    set({ ...s, matches: s.matches.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  },
  deleteMatch(id: string) {
    const s = load();
    set({ ...s, matches: s.matches.filter((m) => m.id !== id) });
  },
  addGoal(g: Omit<Goal, "id" | "createdAt" | "completed">) {
    const s = load();
    set({ ...s, goals: [...s.goals, { ...g, id: uid(), completed: false, createdAt: new Date().toISOString() }] });
  },
  updateGoal(id: string, patch: Partial<Goal>) {
    const s = load();
    set({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) });
  },
  deleteGoal(id: string) {
    const s = load();
    set({ ...s, goals: s.goals.filter((g) => g.id !== id) });
  },
  updateProfile(p: Profile) {
    set({ ...load(), profile: p });
  },
  clearDemo() {
    const s = load();
    set({ ...s, matches: s.matches.filter((m) => !m.demo), goals: s.goals.filter((g) => !g.id.startsWith("demo-")) });
  },
  loadDemo() {
    const s = load();
    const demo = buildDemoState();
    const real = s.matches.filter((m) => !m.demo);
    set({ ...s, matches: [...real, ...demo.matches], goals: [...s.goals.filter((g) => !g.id.startsWith("demo-")), ...demo.goals] });
  },
  resetAll() {
    set({ ...EMPTY, profile: { username: "player", tag: "", rank: "Unranked", rr: 0 } });
  },
};

export const MAPS = [
  "Ascent", "Bind", "Haven", "Split", "Lotus", "Sunset", "Icebox", "Breeze", "Pearl", "Fracture", "Abyss",
];

export const AGENTS = [
  "Jett", "Raze", "Reyna", "Phoenix", "Neon", "Yoru", "Iso", "Waylay",
  "Sova", "Breach", "Skye", "KAY/O", "Fade", "Gekko", "Tejo",
  "Omen", "Brimstone", "Viper", "Astra", "Harbor", "Clove",
  "Killjoy", "Cypher", "Sage", "Chamber", "Deadlock", "Vyse",
];

const TIERS = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal"];
export const RANKS = [...TIERS.flatMap((t) => [1, 2, 3].map((n) => `${t} ${n}`)), "Radiant"];

export const rankIndex = (r: string) => Math.max(0, RANKS.indexOf(r));

export const SECTORS = [
  {
    name: "OUTER DRIFT",
    start: 0,
    bg: "#050b13",
    grid: "rgba(65,184,220,.07)",
    accent: "#79e8ff",
    pressure: 1,
  },
  {
    name: "EMBER BELT",
    start: 120,
    bg: "#120909",
    grid: "rgba(255,116,78,.08)",
    accent: "#ff8a62",
    pressure: 1.07,
  },
  {
    name: "VIOLET WAKE",
    start: 240,
    bg: "#0d0716",
    grid: "rgba(190,104,255,.08)",
    accent: "#c687ff",
    pressure: 1.12,
  },
  {
    name: "NULL LATTICE",
    start: 360,
    bg: "#050d0d",
    grid: "rgba(92,255,202,.07)",
    accent: "#79ffd2",
    pressure: 1.18,
  },
  {
    name: "CORE APPROACH",
    start: 480,
    bg: "#13060d",
    grid: "rgba(255,83,132,.09)",
    accent: "#ff668f",
    pressure: 1.27,
  },
];

export function sectorAt(time) {
  let current = SECTORS[0];
  for (const s of SECTORS) if (time >= s.start) current = s;
  return current;
}
export function sectorIndex(time) {
  return SECTORS.indexOf(sectorAt(time));
}

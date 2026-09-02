import { loadSettings, saveSettings } from "./meta.js";

const KEY = "orbital-playground-build-v1";
const LAUNCH_KEY = "orbital-playground-launch";
const TRAITS = [
  ["multishot", "Forked Signal", "FORK", "Each volley gains another branch."],
  [
    "pierce",
    "Phase Rounds",
    "PIERCE",
    "Rounds continue through additional targets.",
  ],
  [
    "size",
    "Heavy Payload",
    "PAYLOAD",
    "Larger rounds; future fragments inherit their mass.",
  ],
  [
    "crit",
    "Lucky Circuit",
    "CRIT",
    "Adds critical-hit logic to the blaster tree.",
  ],
  [
    "bullet",
    "Rail Accelerators",
    "VELOCITY",
    "Faster projectiles and future kinetic interactions.",
  ],
  [
    "missile",
    "Seeker Rack",
    "SEEK",
    "Guidance layer; branches can acquire targets independently.",
  ],
  [
    "arc",
    "Arc Conductor",
    "ARC",
    "Impact layer for chain-lightning interactions.",
  ],
  ["nova", "Nova Core", "NOVA", "Kill/impact shockwave layer."],
  [
    "mines",
    "Grav Mines",
    "ANCHOR",
    "Persistent projectile/area-control layer.",
  ],
  ["beam", "Prism Lance", "PRISM", "Piercing energy-conversion layer."],
];
const SYNERGIES = [
  {
    name: "Forked Guidance",
    need: ["multishot", "missile"],
    tier: 2,
    desc: "Forked rounds acquire targets independently.",
  },
  {
    name: "Critical Conduction",
    need: ["crit", "arc"],
    tier: 2,
    desc: "Critical hits amplify and extend chain lightning.",
  },
  {
    name: "Mass Driver",
    need: ["size", "bullet"],
    tier: 2,
    desc: "Heavy rounds convert velocity into impact power.",
  },
  {
    name: "Phase Discharge",
    need: ["pierce", "nova"],
    tier: 2,
    desc: "Each pierced target charges the eventual shockwave.",
  },
  {
    name: "Prismatic Phase",
    need: ["pierce", "beam"],
    tier: 2,
    desc: "Piercing rounds leave a short energy lance through their path.",
  },
  {
    name: "Seeking Storm",
    need: ["multishot", "missile", "arc"],
    tier: 3,
    desc: "Independent seekers discharge arcs from every successful branch.",
  },
  {
    name: "Critical Mass",
    need: ["size", "crit", "nova"],
    tier: 3,
    desc: "Critical heavy impacts create amplified shockwaves.",
  },
  {
    name: "Rail Prism",
    need: ["bullet", "pierce", "beam"],
    tier: 3,
    desc: "High-velocity pierce converts the volley into chained prism lanes.",
  },
  {
    name: "Recursive Violence",
    need: ["multishot", "pierce", "missile", "arc"],
    tier: 4,
    desc: "Branches seek, pierce, retarget and conduct. Child effects inherit compatible traits.",
  },
  {
    name: "Event Horizon",
    need: ["size", "nova", "mines", "pierce"],
    tier: 4,
    desc: "Heavy piercing impacts seed anchors that detonate stored shockwave energy.",
  },
];
let build = {};
try {
  build = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
} catch {
  build = {};
}
const has = (id) => (build[id] || 0) > 0;
const save = () => localStorage.setItem(KEY, JSON.stringify(build));
function activeSynergies() {
  return SYNERGIES.filter((s) => s.need.every(has));
}
function ensureLaunchButton() {
  const actions = document.querySelector(".playground-actions");
  if (!actions || document.querySelector("#playgroundLaunch")) return;
  const b = document.createElement("button");
  b.id = "playgroundLaunch";
  b.textContent = "LAUNCH TEST ARENA";
  b.className = "playground-launch";
  actions.prepend(b);
  b.onclick = launchArena;
}
function render() {
  const grid = document.querySelector("#playgroundTraits"),
    synergies = document.querySelector("#playgroundSynergies"),
    summary = document.querySelector("#playgroundSummary");
  if (!grid) return;
  ensureLaunchButton();
  grid.innerHTML = "";
  for (const [id, name, tag, desc] of TRAITS) {
    const level = build[id] || 0,
      b = document.createElement("button");
    b.className = "playground-trait" + (level ? " active" : "");
    b.innerHTML = `<span>${tag}</span><strong>${name}</strong><small>${desc}</small><em>${level ? `ACTIVE · L${level}` : "ADD TRAIT"}</em>`;
    b.onclick = () => {
      build[id] = level ? 0 : 1;
      save();
      render();
    };
    grid.appendChild(b);
  }
  const active = activeSynergies();
  synergies.innerHTML = active.length
    ? active
        .map(
          (s) =>
            `<article class="synergy-node tier-${s.tier}"><span>TIER ${s.tier} SYNERGY</span><strong>${s.name}</strong><p>${s.desc}</p><small>${s.need.map((id) => TRAITS.find((t) => t[0] === id)?.[2] || id).join(" + ")}</small></article>`,
        )
        .join("")
    : `<div class="synergy-empty"><b>NO INTERACTIONS YET</b><span>Add traits above. Pair, compound and transformation synergies will appear here.</span></div>`;
  const selected = TRAITS.filter(([id]) => has(id));
  summary.innerHTML = `<b>${selected.length} TRAIT${selected.length === 1 ? "" : "S"}</b><span>${active.length} ACTIVE SYNERG${active.length === 1 ? "Y" : "IES"}</span>`;
  const launch = document.querySelector("#playgroundLaunch");
  if (launch) {
    launch.disabled = !selected.length;
    launch.textContent = selected.length
      ? `LAUNCH TEST ARENA · ${selected.length} TRAITS`
      : "SELECT TRAITS TO LAUNCH";
  }
}
function launchArena() {
  if (!TRAITS.some(([id]) => has(id))) return;
  save();
  const settings = loadSettings();
  settings.mode = "playground";
  saveSettings(settings);
  sessionStorage.setItem(LAUNCH_KEY, "1");
  location.reload();
}
function resumeLaunch() {
  if (sessionStorage.getItem(LAUNCH_KEY) !== "1") return;
  sessionStorage.removeItem(LAUNCH_KEY);
  setTimeout(() => document.querySelector("#start")?.click(), 0);
}
export function openPlayground() {
  document.dispatchEvent(
    new CustomEvent("orbital:show-panel", { detail: "playground" }),
  );
  render();
}
addEventListener("DOMContentLoaded", () => {
  document
    .querySelector("#openPlayground")
    ?.addEventListener("click", openPlayground);
  document.querySelector("#playgroundClear")?.addEventListener("click", () => {
    build = {};
    save();
    render();
  });
  document.querySelector("#playgroundMax")?.addEventListener("click", () => {
    for (const [id] of TRAITS) build[id] = 1;
    save();
    render();
  });
  render();
  resumeLaunch();
});

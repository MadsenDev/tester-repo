const BASE_MODIFIERS = Object.freeze({
  fire: 1,
  enemySpeed: 1,
  magnet: 1,
  elite: 0,
  score: 1,
  spawn: 1,
  xp: 1,
  damageTaken: 1,
});

export const SECTOR_ROUTES = Object.freeze([
  {
    id: "quiet-line",
    name: "QUIET LINE",
    risk: "SAFE",
    glyph: "◇",
    color: "#7cf6c8",
    reward: "Repair 28% hull and reinforce maximum hull by 8.",
    threat: "Salvage score is reduced by 8% in this sector.",
    modifiers: { score: 0.92, spawn: 0.9 },
    apply(player) {
      player.maxHp += 8;
      player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.28);
    },
  },
  {
    id: "salvage-current",
    name: "SALVAGE CURRENT",
    risk: "BALANCED",
    glyph: "◆",
    color: "#78ebff",
    reward: "Gain 12% permanent XP yield; salvage pulls from farther away.",
    threat: "Hostile density rises by 16%.",
    modifiers: { magnet: 1.7, spawn: 1.16, score: 1.15 },
    apply(player) {
      player.xpGain *= 1.12;
    },
  },
  {
    id: "redline-gate",
    name: "REDLINE GATE",
    risk: "DANGEROUS",
    glyph: "ϟ",
    color: "#ff8a62",
    reward: "Permanently accelerate all weapon cycles by 7%.",
    threat: "Enemies move 14% faster and pressure rises by 22%.",
    modifiers: { enemySpeed: 1.14, spawn: 1.22, score: 1.38 },
    apply(player) {
      player.fireRate *= 0.93;
    },
  },
  {
    id: "hunter-array",
    name: "HUNTER ARRAY",
    risk: "DANGEROUS",
    glyph: "⌖",
    color: "#ffe077",
    reward: "Permanently increase weapon damage by 9%.",
    threat: "Elite signatures spike throughout the sector.",
    modifiers: { elite: 0.24, spawn: 1.08, score: 1.42 },
    apply(player) {
      player.damage *= 1.09;
    },
  },
  {
    id: "gravity-shear",
    name: "GRAVITY SHEAR",
    risk: "VOLATILE",
    glyph: "◎",
    color: "#c994ff",
    reward: "Gain 10% permanent movement speed and extreme pickup range.",
    threat: "Hull damage is amplified by 22%.",
    modifiers: { magnet: 2.25, damageTaken: 1.22, score: 1.35 },
    apply(player) {
      player.speed *= 1.1;
    },
  },
  {
    id: "black-signal",
    name: "BLACK SIGNAL",
    risk: "VOLATILE",
    glyph: "◉",
    color: "#ff79ad",
    reward: "Gain 10% permanent damage and 8% permanent XP yield.",
    threat: "Faster enemies arrive 28% more often.",
    modifiers: { enemySpeed: 1.1, spawn: 1.28, score: 1.55 },
    apply(player) {
      player.damage *= 1.1;
      player.xpGain *= 1.08;
    },
  },
  {
    id: "aegis-corridor",
    name: "AEGIS CORRIDOR",
    risk: "SAFE",
    glyph: "⬡",
    color: "#9dffd1",
    reward: "Permanently reinforce damage resistance by 3%.",
    threat: "The protected passage yields 10% less score.",
    modifiers: { enemySpeed: 0.92, score: 0.9 },
    apply(player) {
      player.armor = Math.min(0.65, player.armor + 0.03);
    },
  },
  {
    id: "research-wake",
    name: "RESEARCH WAKE",
    risk: "BALANCED",
    glyph: "✹",
    color: "#8ee8ff",
    reward: "Gain 4% permanent critical chance and 35% sector XP yield.",
    threat: "Unstable telemetry amplifies hull damage by 12%.",
    modifiers: { xp: 1.35, damageTaken: 1.12, score: 1.18 },
    apply(player) {
      player.crit = Math.min(0.75, player.crit + 0.04);
    },
  },
  {
    id: "munitions-vault",
    name: "MUNITIONS VAULT",
    risk: "DANGEROUS",
    glyph: "✦",
    color: "#ffbd72",
    reward:
      "Permanently increase weapon damage by 7% and projectile mass by 10%.",
    threat: "Vault guardians increase elite activity and pressure.",
    modifiers: { elite: 0.14, spawn: 1.12, score: 1.4 },
    apply(player) {
      player.damage *= 1.07;
      player.bulletSize *= 1.1;
    },
  },
  {
    id: "razor-passage",
    name: "RAZOR PASSAGE",
    risk: "DANGEROUS",
    glyph: "➤",
    color: "#ff9a8d",
    reward: "Permanently add one level of projectile piercing.",
    threat: "Hostiles move 18% faster through the narrow lane.",
    modifiers: { enemySpeed: 1.18, score: 1.43 },
    apply(player) {
      player.pierce += 1;
    },
  },
  {
    id: "glass-orbit",
    name: "GLASS ORBIT",
    risk: "VOLATILE",
    glyph: "△",
    color: "#ff82c3",
    reward: "Gain 12% permanent damage and 8% critical chance.",
    threat: "Incoming hull damage is amplified by 55%.",
    modifiers: { damageTaken: 1.55, score: 1.82 },
    apply(player) {
      player.damage *= 1.12;
      player.crit = Math.min(0.75, player.crit + 0.08);
    },
  },
  {
    id: "swarm-nest",
    name: "SWARM NEST",
    risk: "VOLATILE",
    glyph: "⑂",
    color: "#b7ff65",
    reward: "Permanently add one round to every blaster volley.",
    threat: "Enemy pressure rises by 50% for the entire sector.",
    modifiers: { spawn: 1.5, enemySpeed: 1.06, score: 1.62 },
    apply(player) {
      player.shots += 1;
      player.damage *= 0.94;
    },
  },
]);

export function createRouteState() {
  return { resolvedLeg: 0, active: null, history: [], offered: [] };
}

export function routeLeg(time) {
  return Math.floor(Math.max(0, time) / 120);
}

export function routeDue(state, time) {
  const leg = routeLeg(time);
  return leg > 0 && leg > state.resolvedLeg;
}

export function routeModifiers(state) {
  return { ...BASE_MODIFIERS, ...(state.active?.modifiers || {}) };
}

export function combineModifiers(eventMods, routeMods) {
  return {
    fire: (eventMods.fire ?? 1) * routeMods.fire,
    enemySpeed: (eventMods.enemySpeed ?? 1) * routeMods.enemySpeed,
    magnet: (eventMods.magnet ?? 1) * routeMods.magnet,
    elite: Math.min(0.85, (eventMods.elite ?? 0) + routeMods.elite),
    score: (eventMods.score ?? 1) * routeMods.score,
    spawn: (eventMods.spawn ?? 1) * routeMods.spawn,
    xp: (eventMods.xp ?? 1) * routeMods.xp,
    damageTaken: (eventMods.damageTaken ?? 1) * routeMods.damageTaken,
  };
}

function shuffled(items, random) {
  return items
    .map((item) => ({ item, order: random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => item);
}

export function routeChoices(state, random = Math.random) {
  const previous = state.history.at(-1);
  const seen = new Set(state.offered || []);
  const pool = (risks) => {
    const lane = SECTOR_ROUTES.filter((route) => risks.includes(route.risk));
    const fresh = lane.filter((route) => !seen.has(route.id));
    return shuffled(
      (fresh.length ? fresh : lane).filter((route) => route.id !== previous),
      random,
    );
  };
  const safe = pool(["SAFE", "BALANCED"]);
  const dangerous = pool(["DANGEROUS"]);
  const volatile = pool(["VOLATILE"]);
  const choices = [safe[0], dangerous[0], volatile[0]].filter(Boolean);
  state.offered ??= [];
  state.offered.push(...choices.map((route) => route.id));
  return choices;
}

export function selectRoute(state, routeId, player, leg) {
  const route = SECTOR_ROUTES.find((candidate) => candidate.id === routeId);
  if (!route) throw new Error(`Unknown sector route: ${routeId}`);
  route.apply(player);
  state.active = route;
  state.resolvedLeg = leg;
  state.history.push(route.id);
  return route;
}

function installStylesheet() {
  if (document.querySelector("link[data-sector-routes]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./sector-routes.css?v=2";
  link.dataset.sectorRoutes = "1";
  document.head.appendChild(link);
}

export function createRouteUI() {
  installStylesheet();
  const panel = document.createElement("section");
  panel.id = "route";
  panel.className = "panel route-panel hidden";
  panel.innerHTML = `
    <div class="route-heading">
      <div><p class="eyebrow">SECTOR TRANSIT</p><h2>Choose your line</h2></div>
      <span id="routeLeg">LEG 02</span>
    </div>
    <p class="route-intro">Navigation found three viable passages. Each reward is permanent; each threat lasts until the next sector boundary.</p>
    <div id="routeChoices" class="route-choices"></div>
    <p class="route-note">THE RUN IS PAUSED // ROUTE SELECTION IS FINAL</p>`;
  document
    .querySelector(".screen-stack")
    ?.insertBefore(panel, document.querySelector("#levelup"));

  const badge = document.createElement("span");
  badge.className = "route-badge hidden";
  document.querySelector(".hud-secondary")?.prepend(badge);
  return { panel, badge, choices: panel.querySelector("#routeChoices") };
}

export function renderRouteChoice(ui, routes, leg, onSelect) {
  ui.panel.querySelector("#routeLeg").textContent =
    `LEG ${String(leg + 1).padStart(2, "0")}`;
  ui.choices.replaceChildren();
  for (const route of routes) {
    const button = document.createElement("button");
    button.className = "route-choice";
    button.style.setProperty("--route-color", route.color);
    button.innerHTML = `
      <div class="route-choice-top"><span>${route.risk}</span><i>${route.glyph}</i></div>
      <h3>${route.name}</h3>
      <dl><div><dt>GAIN</dt><dd>${route.reward}</dd></div><div><dt>THREAT</dt><dd>${route.threat}</dd></div></dl>
      <strong>TAKE THIS LINE <span>→</span></strong>`;
    button.addEventListener("click", () => onSelect(route.id));
    ui.choices.appendChild(button);
  }
}

export function updateRouteBadge(ui, state) {
  const route = state.active;
  ui.badge.classList.toggle("hidden", !route);
  if (!route) return;
  ui.badge.textContent = `${route.glyph} ${route.name}`;
  ui.badge.style.setProperty("--route-color", route.color);
}

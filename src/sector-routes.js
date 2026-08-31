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
]);

export function createRouteState() {
  return { resolvedLeg: 0, active: null, history: [] };
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
    fire: eventMods.fire * routeMods.fire,
    enemySpeed: eventMods.enemySpeed * routeMods.enemySpeed,
    magnet: eventMods.magnet * routeMods.magnet,
    elite: Math.min(0.85, eventMods.elite + routeMods.elite),
    score: eventMods.score * routeMods.score,
    spawn: routeMods.spawn,
    xp: routeMods.xp,
    damageTaken: routeMods.damageTaken,
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
  const candidates = SECTOR_ROUTES.filter((route) => route.id !== previous);
  const safe = shuffled(
    candidates.filter(
      (route) => route.risk === "SAFE" || route.risk === "BALANCED",
    ),
    random,
  );
  const dangerous = shuffled(
    candidates.filter((route) => route.risk === "DANGEROUS"),
    random,
  );
  const volatile = shuffled(
    candidates.filter((route) => route.risk === "VOLATILE"),
    random,
  );
  return [safe[0], dangerous[0], volatile[0]].filter(Boolean);
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
  link.href = "./sector-routes.css?v=1";
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

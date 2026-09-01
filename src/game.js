import { AudioSystem } from "./audio.js";
import { clamp, dist2, spawnEnemy, particle } from "./entities.js";
import { randomChoices } from "./upgrades.js";
import { MODULE_POOLS, modulePoolForLevel } from "./module-catalog.js";
import {
  initWeapons,
  updateWeapons,
  updateWeaponProjectiles,
  weaponLabel,
} from "./weapons.js";
import { createInput } from "./input.js";
import { moveEnemy } from "./enemy-ai.js";
import { renderScene } from "./render.js";
import { spawnBoss, updateBoss } from "./bosses.js";
import {
  bossDifficulty,
  prepareBossArena,
  regularEnemiesAllowed,
} from "./boss-difficulty.js";
import { sectorAt } from "./world.js";
import {
  loadSettings,
  saveSettings,
  loadStats,
  recordRun,
  resetStats,
  difficultyConfig,
} from "./meta.js";
import { createHazardState, updateHazards } from "./hazards.js";
import { onCompanionProjectileHit } from "./companions.js";
import { createEventState, updateEvents, eventModifiers } from "./events.js";
import { SHIPS, unlockedShips, shipById, applyShip } from "./ships.js";
import {
  MODES,
  unlockedModes,
  modeById,
  objectiveFor,
  runLimit,
  allowsRegularEnemies,
  bossInterval,
  preparePlayerForMode,
  spawnPressure,
} from "./modes.js";
import {
  combineModifiers,
  createRouteState,
  createRouteUI,
  renderRouteChoice,
  routeChoices,
  routeDue,
  routeLeg,
  routeModifiers,
  selectRoute,
  updateRouteBadge,
} from "./sector-routes.js";
import {
  afterSpecialDamage,
  echoSpecialVolley,
  onSpecialKill,
  onSpecialLevelUp,
  resolveSpecialDamage,
  specialChoiceCount,
  specialDamageMultiplier,
  specialGemMultiplier,
  updateSpecialModules,
} from "./special-modules.js";
import {
  acceptBlackSignal,
  blackSignalOffers,
  createBlackSignalUI,
  renderBlackSignal,
  shouldOfferBlackSignal,
} from "./black-signal.js";
import { discover, recordArchiveRun } from "./discovery.js";
import { activeSynergies } from "./synergy-catalog.js";
import { attractPowerup, rollPowerupDrop } from "./drop-economy.js";
import { regulateProjectilePressure } from "./projectile-pressure.js";
import {
  applyFriendlyVisualBudget,
  compressSalvage,
} from "./combat-readability.js";
import { bossDamageMultiplier } from "./boss-counterplay.js";
import { compactArsenalLabel } from "./hud-summary.js";
import {
  syncManifestations,
  updateManifestations,
} from "./manifestations.js";
const routeUi = createRouteUI();
const blackSignalUi = createBlackSignalUI();
const canvas = document.querySelector("#game"),
  ctx = canvas.getContext("2d");
const ui = {
  overlay: document.querySelector("#overlay"),
  menu: document.querySelector("#menu"),
  settings: document.querySelector("#settings"),
  stats: document.querySelector("#stats"),
  levelup: document.querySelector("#levelup"),
  route: routeUi.panel,
  blackSignal: blackSignalUi.panel,
  gameover: document.querySelector("#gameover"),
  victory: document.querySelector("#victory"),
  fatal: document.querySelector("#fatal"),
  fatalMessage: document.querySelector("#fatalMessage"),
  choices: document.querySelector("#choices"),
  hp: document.querySelector("#hp"),
  level: document.querySelector("#level"),
  time: document.querySelector("#time"),
  score: document.querySelector("#score"),
  hpBar: document.querySelector("#hpBar"),
  xpBar: document.querySelector("#xpBar"),
  combo: document.querySelector("#combo"),
  arsenal: document.querySelector("#arsenal"),
  sector: document.querySelector("#sector"),
  objective: document.querySelector("#objective"),
  bossName: document.querySelector("#bossName"),
  best: document.querySelector("#best"),
  finalScore: document.querySelector("#finalScore"),
  victoryScore: document.querySelector("#victoryScore"),
  difficulty: document.querySelector("#difficultySetting"),
  shake: document.querySelector("#shakeSetting"),
  sound: document.querySelector("#soundSetting"),
  statRuns: document.querySelector("#statRuns"),
  statWins: document.querySelector("#statWins"),
  statKills: document.querySelector("#statKills"),
  statBest: document.querySelector("#statBest"),
  shipSelect: document.querySelector("#shipSelect"),
  shipDesc: document.querySelector("#shipDesc"),
  modeSelect: document.querySelector("#modeSelect"),
  modeDesc: document.querySelector("#modeDesc"),
  nextUnlock: document.querySelector("#nextUnlock"),
};
const audio = new AudioSystem();
let settings = loadSettings(),
  stats = loadStats();
audio.muted = !settings.sound;
const viewportSize = () => ({
  w: Math.max(1, Math.round(globalThis.visualViewport?.width || innerWidth)),
  h: Math.max(1, Math.round(globalThis.visualViewport?.height || innerHeight)),
});
let { w: W, h: H } = viewportSize(),
  dpr = 1,
  last = 0,
  state = "menu",
  time = 0,
  score = 0,
  nextBoss = 60,
  spawnTimer = 0,
  shake = 0,
  combo = 0,
  comboTimer = 0,
  kills = 0,
  killsSinceRepair = 0,
  bossCount = 0,
  pendingBlackSignal = false,
  defeatedBosses = [],
  encounteredEvents = [],
  contractHistory = [],
  runDiscoveries = [],
  player,
  enemies = [],
  bullets = [],
  enemyBullets = [],
  gems = [],
  particles = [],
  powerups = [],
  hazards = createHazardState(),
  events = createEventState(),
  routes = createRouteState();
const input = createInput(canvas, {
  getState: () => state,
  onPauseToggle: () => {
    if (state === "playing") state = "paused";
    else if (state === "paused") state = "playing";
  },
  onMute: () => {
    settings.sound = !settings.sound;
    audio.muted = !settings.sound;
    saveSettings(settings);
    refreshSettings();
  },
});
function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  const size = viewportSize();
  W = size.w;
  H = size.h;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  if (player) {
    const m = player.r + 4;
    player.x = clamp(player.x, m, W - m);
    player.y = clamp(player.y, m, H - m);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
globalThis.visualViewport?.addEventListener("resize", resize);
addEventListener("orientationchange", resize);
resize();
function allPanels() {
  return [
    ui.menu,
    ui.settings,
    ui.stats,
    ui.levelup,
    ui.route,
    ui.blackSignal,
    ui.gameover,
    ui.victory,
    ui.fatal,
  ];
}
function noteDiscovery(kind, id) {
  if (discover(kind, id)) runDiscoveries.push({ kind, id });
}
function syncSynergyDiscoveries() {
  for (const synergy of activeSynergies(player))
    noteDiscovery("synergies", synergy.id);
}
function hidePanels() {
  for (const p of allPanels()) p?.classList.add("hidden");
}
function showPanel(panel) {
  hidePanels();
  panel.classList.remove("hidden");
  ui.overlay.classList.add("show");
}
function showMenu() {
  showPanel(ui.menu);
  refreshStats();
  refreshSettings();
  refreshShip();
  refreshMode();
}
function refreshSettings() {
  ui.difficulty.querySelector("b").textContent =
    settings.difficulty.toUpperCase();
  ui.shake.querySelector("b").textContent = settings.shake ? "ON" : "OFF";
  ui.sound.querySelector("b").textContent = settings.sound ? "ON" : "OFF";
}
function refreshStats() {
  stats = loadStats();
  ui.best.textContent = Math.max(
    stats.best,
    Number(localStorage.getItem("orbital-best") || 0),
  );
  ui.statRuns.textContent = stats.runs;
  ui.statWins.textContent = stats.wins;
  ui.statKills.textContent = stats.kills;
  ui.statBest.textContent = stats.best;
  const lockedShips = SHIPS.filter(
      (s) => !unlockedShips(stats).some((u) => u.id === s.id),
    ),
    lockedModes = MODES.filter(
      (m) => !unlockedModes(stats).some((u) => u.id === m.id),
    );
  const notes = [];
  if (lockedShips.length)
    notes.push(
      "Next chassis: " + lockedShips[0].name + " — " + lockedShips[0].unlock,
    );
  if (lockedModes.length)
    notes.push(
      "Next mode: " + lockedModes[0].name + " — " + lockedModes[0].unlock,
    );
  ui.nextUnlock.textContent = notes.length
    ? notes.join(" · ")
    : "All current chassis and modes unlocked.";
}
function refreshShip() {
  const available = unlockedShips(stats);
  if (!available.some((s) => s.id === settings.ship)) {
    settings.ship = "strider";
    saveSettings(settings);
  }
  const ship = shipById(settings.ship);
  ui.shipSelect.querySelector("b").textContent = ship.name;
  ui.shipDesc.textContent = ship.desc;
}
function refreshMode() {
  const available = unlockedModes(stats);
  if (!available.some((m) => m.id === settings.mode)) {
    settings.mode = "campaign";
    saveSettings(settings);
  }
  const mode = modeById(settings.mode);
  ui.modeSelect.querySelector("b").textContent = mode.name;
  ui.modeDesc.textContent = mode.desc;
  ui.objective.textContent = objectiveFor(mode.id);
}
refreshStats();
refreshSettings();
refreshShip();
refreshMode();
document.querySelector("#start").onclick = () => start();
document.querySelector("#restart").onclick = () => start();
document.querySelector("#victoryRestart").onclick = () => start();
document.querySelector("#openSettings").onclick = () => showPanel(ui.settings);
document.querySelector("#openStats").onclick = () => {
  refreshStats();
  showPanel(ui.stats);
};
document.querySelectorAll(".back").forEach((b) => (b.onclick = showMenu));
document
  .querySelector("#fatalRestart")
  ?.addEventListener("click", () => location.reload());
ui.difficulty.onclick = () => {
  settings.difficulty =
    settings.difficulty === "normal"
      ? "intense"
      : settings.difficulty === "intense"
        ? "chill"
        : "normal";
  saveSettings(settings);
  refreshSettings();
};
ui.shake.onclick = () => {
  settings.shake = !settings.shake;
  saveSettings(settings);
  refreshSettings();
};
ui.sound.onclick = () => {
  settings.sound = !settings.sound;
  audio.muted = !settings.sound;
  saveSettings(settings);
  refreshSettings();
};
ui.shipSelect.onclick = () => {
  const available = unlockedShips(stats),
    i = Math.max(
      0,
      available.findIndex((s) => s.id === settings.ship),
    );
  settings.ship = available[(i + 1) % available.length].id;
  saveSettings(settings);
  refreshShip();
};
ui.modeSelect.onclick = () => {
  const available = unlockedModes(stats),
    i = Math.max(
      0,
      available.findIndex((m) => m.id === settings.mode),
    );
  settings.mode = available[(i + 1) % available.length].id;
  saveSettings(settings);
  refreshMode();
};
document.querySelector("#resetStats").onclick = () => {
  stats = resetStats();
  settings.ship = "strider";
  settings.mode = "campaign";
  saveSettings(settings);
  refreshStats();
  refreshShip();
  refreshMode();
};
function freshPlayer() {
  return {
    x: W / 2,
    y: H / 2,
    r: 11,
    hp: 100,
    maxHp: 100,
    speed: 245,
    fireRate: 0.42,
    fireCd: 0,
    damage: 18,
    shots: 1,
    pierce: 0,
    bulletSpeed: 520,
    bulletSize: 4,
    magnet: 110,
    regen: 0,
    crit: 0.05,
    armor: 0,
    dashBoost: 0,
    xpGain: 1,
    orbitals: 0,
    invuln: 0,
    boost: 0,
    level: 1,
    xp: 0,
    nextXp: 35,
    overdrive: 0,
    nullified: false,
    shipSides: 3,
    shipColor: "#78ebff",
  };
}
function start() {
  try {
    try {
      audio.ensure();
    } catch (err) {
      console.warn("Audio unavailable", err);
    }
    player = applyShip(freshPlayer(), settings.ship);
    initWeapons(player);
    preparePlayerForMode(player, settings.mode);
    enemies = [];
    bullets = [];
    enemyBullets = [];
    gems = [];
    particles = [];
    powerups = [];
    hazards = createHazardState();
    events = createEventState();
    routes = createRouteState();
    updateRouteBadge(routeUi, routes);
    time =
      score =
      spawnTimer =
      shake =
      combo =
      comboTimer =
      kills =
      killsSinceRepair =
      bossCount =
        0;
    nextBoss = settings.mode === "bossrush" ? 2 : bossInterval(settings.mode);
    pendingBlackSignal = false;
    defeatedBosses = [];
    encounteredEvents = [];
    contractHistory = [];
    runDiscoveries = [];
    input.stopTouch();
    hidePanels();
    state = "playing";
    ui.overlay.classList.remove("show");
    updateUI();
    update(1 / 60);
    render();
  } catch (error) {
    showFatal(error);
  }
}
function finish(victory = false) {
  if (state !== "playing") return;
  state = victory ? "victory" : "gameover";
  input.stopTouch();
  const rounded = Math.floor(score),
    best = Math.max(rounded, Number(localStorage.getItem("orbital-best") || 0));
  localStorage.setItem("orbital-best", best);
  stats = recordRun({ won: victory, kills, score: rounded });
  const run = recordArchiveRun({
    won: victory,
    ship: settings.ship,
    mode: settings.mode,
    score: rounded,
    kills,
    time,
    level: player.level,
    modules: [...(player.items || [])],
    routes: [...routes.history],
    bosses: [...defeatedBosses],
    events: [...encounteredEvents],
    synergies: activeSynergies(player).map((synergy) => synergy.id),
    contracts: [...contractHistory],
    newly: [...runDiscoveries],
  });
  window.dispatchEvent(
    new CustomEvent("orbital:run-finished", { detail: run }),
  );
  refreshStats();
  refreshShip();
  refreshMode();
  if (victory) {
    ui.victoryScore.textContent = rounded;
    showPanel(ui.victory);
    audio.level();
  } else {
    ui.finalScore.textContent = rounded;
    showPanel(ui.gameover);
  }
}
function showFatal(error) {
  state = "fatal";
  input.stopTouch();
  console.error(error);
  ui.fatalMessage.textContent = (
    error?.stack ||
    error?.message ||
    String(error)
  ).slice(0, 1800);
  showPanel(ui.fatal);
}
function levelUp() {
  onSpecialLevelUp(player, enemyBullets);
  const pool = modulePoolForLevel(player.level),
    poolMeta = MODULE_POOLS[pool];
  state = "levelup";
  input.stopTouch();
  audio.level();
  showPanel(ui.levelup);
  ui.levelup.querySelector(".eyebrow").textContent = poolMeta.name;
  ui.levelup.style.setProperty("--module-source", poolMeta.color);
  ui.choices.innerHTML = "";
  for (const u of randomChoices(player, specialChoiceCount(player), pool)) {
    const b = document.createElement("button");
    b.className = "choice";
    b.innerHTML = "<b>" + u.name + "</b><small>" + u.desc + "</small>";
    b.onclick = () => {
      u.apply(player);
      noteDiscovery("modules", u.id);
      syncSynergyDiscoveries();
      ui.levelup.classList.add("hidden");
      ui.overlay.classList.remove("show");
      state = "playing";
      updateUI();
    };
    ui.choices.appendChild(b);
  }
}
function routesEnabled() {
  return settings.mode === "campaign" || settings.mode === "endless";
}
function chooseSectorRoute() {
  const leg = routeLeg(time);
  state = "route";
  input.stopTouch();
  renderRouteChoice(routeUi, routeChoices(routes), leg, (routeId) => {
    selectRoute(routes, routeId, player, leg);
    noteDiscovery("routes", routeId);
    updateRouteBadge(routeUi, routes);
    ui.route.classList.add("hidden");
    ui.overlay.classList.remove("show");
    state = "playing";
    audio.level();
    updateUI();
  });
  showPanel(ui.route);
}
function chooseBlackSignal() {
  const offers = blackSignalOffers(player);
  pendingBlackSignal = false;
  if (!offers.length) return;
  state = "blacksignal";
  input.stopTouch();
  const resume = () => {
    ui.blackSignal.classList.add("hidden");
    ui.overlay.classList.remove("show");
    state = "playing";
    updateUI();
  };
  renderBlackSignal(blackSignalUi, offers, {
    onAccept(offer) {
      const accepted = acceptBlackSignal(player, offer);
      contractHistory.push(accepted);
      noteDiscovery("modules", accepted.module);
      syncSynergyDiscoveries();
      audio.level();
      resume();
    },
    onReject: resume,
  });
  showPanel(ui.blackSignal);
}
function nearest() {
  let best = null,
    bd = Infinity;
  for (const e of enemies) {
    const d = dist2(player, e);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best;
}
function shoot() {
  const t = nearest();
  if (!t) return;
  const base = Math.atan2(t.y - player.y, t.x - player.x),
    startIndex = bullets.length,
    damageMultiplier = specialDamageMultiplier(player);
  for (let i = 0; i < player.shots; i++) {
    const spread = (i - (player.shots - 1) / 2) * 0.14,
      a = base + spread;
    bullets.push({
      kind: "blaster",
      x: player.x,
      y: player.y,
      vx: Math.cos(a) * player.bulletSpeed,
      vy: Math.sin(a) * player.bulletSpeed,
      r: player.bulletSize,
      life: 1.8,
      pierce: player.pierce,
      damage:
        player.damage *
        damageMultiplier *
        (Math.random() < player.crit ? 2 : 1),
    });
  }
  echoSpecialVolley(player, bullets, startIndex);
  audio.shot();
}
function hurt(amount) {
  if (player.invuln > 0 || state !== "playing") return;
  const diff = difficultyConfig(settings.difficulty),
    mods = combineModifiers(
      settings.mode === "bossrush" ? {} : eventModifiers(events),
      routeModifiers(routes),
    );
  const result = resolveSpecialDamage(
    player,
    amount *
      (1 - player.armor) *
      diff.damage *
      mods.damageTaken *
      (player.contractDamageTaken || 1),
    Math.random,
  );
  if (result.evaded) {
    for (let i = 0; i < 6; i++)
      particles.push(particle(player.x, player.y, "spark"));
    return;
  }
  player.hp -= result.damage;
  player.invuln = 0.22;
  player.boost = 0.65;
  shake = 8;
  combo = comboTimer = 0;
  audio.hurt();
  for (let i = 0; i < 10; i++)
    particles.push(particle(player.x, player.y, "hurt"));
  afterSpecialDamage(player, result);
  if (player.hp <= 0) finish(false);
}
function awardKill(e, mods) {
  const diff = difficultyConfig(settings.difficulty);
  kills++;
  killsSinceRepair++;
  onSpecialKill(player, e);
  if (e.boss) {
    defeatedBosses.push(e.kind);
    noteDiscovery("bosses", e.kind);
    if (shouldOfferBlackSignal(defeatedBosses.length))
      pendingBlackSignal = true;
  }
  combo = comboTimer > 0 ? combo + 1 : 1;
  comboTimer = 2.8;
  score +=
    (e.boss ? 700 : 20 + e.v) *
    (1 + Math.min(combo, 30) * 0.03) *
    diff.score *
    mods.score;
  const n = e.boss ? 16 : 1;
  for (let j = 0; j < n; j++)
    gems.push({
      x: e.x + (Math.random() - 0.5) * 24,
      y: e.y + (Math.random() - 0.5) * 24,
      v: e.boss ? 24 : e.v,
      r: e.boss ? 5 : 4,
    });
  for (let j = 0; j < (e.boss ? 36 : e.elite ? 16 : 9); j++)
    particles.push(particle(e.x, e.y, e.boss ? "boss" : "spark"));
  const drop = rollPowerupDrop(
    e,
    settings.difficulty,
    player,
    killsSinceRepair,
  );
  if (drop) {
    powerups.push({
      x: e.x,
      y: e.y,
      ...drop,
      r: 9,
      phase: Math.random() * 6.28,
    });
    if (drop.kind === "repair") killsSinceRepair = 0;
  }
  if (e.boss && settings.mode === "bossrush") nextBoss = time + 8;
}
function collectPowerup(p) {
  if (p.kind === "repair")
    player.hp = Math.min(player.maxHp, player.hp + (p.value || 32));
  else if (p.kind === "pulse") {
    enemyBullets = [];
    for (const e of enemies) e.hp -= Math.max(80, player.damage * 4);
    shake = 14;
    for (let i = 0; i < 30; i++)
      particles.push(particle(player.x, player.y, "boss"));
  } else if (p.kind === "overdrive")
    player.overdrive = Math.max(player.overdrive, 8);
  audio.level();
}
function update(dt) {
  if (state !== "playing") return;
  time += dt;
  const limit = runLimit(settings.mode);
  if (time >= limit) {
    time = limit;
    updateUI();
    finish(true);
    return;
  }
  if (routesEnabled() && routeDue(routes, time)) {
    chooseSectorRoute();
    return;
  }
  if (settings.mode !== "bossrush") {
    updateEvents(events, dt, time);
    if (events.current && !encounteredEvents.includes(events.current.id)) {
      encounteredEvents.push(events.current.id);
      noteDiscovery("events", events.current.id);
    }
  }
  const eventMods =
      settings.mode === "bossrush"
        ? { fire: 1, enemySpeed: 1, magnet: 1, elite: 0, score: 1 }
        : eventModifiers(events),
    mods = combineModifiers(eventMods, routeModifiers(routes)),
    diff = difficultyConfig(settings.difficulty),
    sector = sectorAt(time);
  score += dt * 10 * diff.score * mods.score;
  comboTimer = Math.max(0, comboTimer - dt);
  if (comboTimer === 0) combo = 0;
  player.invuln = Math.max(0, player.invuln - dt);
  player.boost = Math.max(0, player.boost - dt);
  player.overdrive = Math.max(0, player.overdrive - dt);
  player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);
  const { dx, dy } = input.movement(),
    sp = player.speed * (player.boost > 0 ? 1 + player.dashBoost : 1),
    margin = player.r + 4;
  player.vx = dx * sp;
  player.vy = dy * sp;
  player.x = clamp(player.x + dx * sp * dt, margin, W - margin);
  player.y = clamp(player.y + dy * sp * dt, margin, H - margin);
  player.fireCd -= dt;
  if (player.fireCd <= 0 && !player.nullified) {
    shoot();
    player.fireCd =
      player.fireRate * (player.overdrive > 0 ? 0.55 : 1) * mods.fire;
  }
  if (!player.nullified)
    updateWeapons(
      player,
      dt,
      enemies,
      bullets,
      enemyBullets,
      particles,
      time,
    );
  updateSpecialModules(player, dt, {
    enemies,
    enemyBullets,
    particles,
    time,
  });
  const newManifestations = syncManifestations(player);
  if (newManifestations.length) {
    const latest = newManifestations[newManifestations.length - 1];
    audio.manifestation(latest.tone);
    shake = Math.max(shake, 16);
  }
  updateManifestations(player, dt, { enemies, enemyBullets });
  updateWeaponProjectiles(bullets, enemies, dt);
  const bossAlive = enemies.some((e) => e.boss);
  const bossRules = bossDifficulty(settings.difficulty);
  if (
    allowsRegularEnemies(settings.mode) &&
    regularEnemiesAllowed(settings.difficulty, bossAlive)
  ) {
    const rate =
      Math.max(0.085, 0.7 - time * 0.00092) /
      (diff.spawn *
        sector.pressure *
        spawnPressure(settings.mode, time) *
        mods.spawn);
    spawnTimer -= dt;
    while (spawnTimer <= 0) {
      enemies.push(spawnEnemy(W, H, time, mods.elite));
      spawnTimer += rate;
    }
  }
  if (time >= nextBoss && !bossAlive) {
    bossCount++;
    const bossTime = settings.mode === "bossrush" ? bossCount * 60 : time;
    if (bossRules.clearArena) {
      ({ enemies, enemyBullets } = prepareBossArena(
        enemies,
        enemyBullets,
        settings.difficulty,
      ));
    }
    const boss = spawnBoss(W, H, bossTime, settings.difficulty);
    enemies.push(boss);
    noteDiscovery("bosses", boss.kind);
    nextBoss =
      settings.mode === "bossrush"
        ? Infinity
        : nextBoss + bossInterval(settings.mode);
    audio.boss();
    shake = 12;
  }
  for (const e of enemies) {
    e.flash = Math.max(0, e.flash - dt);
    e.phase += dt;
    e.px = e.x;
    e.py = e.y;
    if (e.boss)
      updateBoss(e, dt, {
        player,
        enemyBullets,
        particles,
        time,
        onHazard: hurt,
        onShake: (v) => (shake = Math.max(shake, v)),
      });
    else {
      const old = e.s;
      e.s *= mods.enemySpeed;
      moveEnemy(e, dt, { player, enemyBullets, particles, time });
      e.s = old;
    }
    player.x = clamp(player.x, margin, W - margin);
    player.y = clamp(player.y, margin, H - margin);
    if (dist2(player, e) < (player.r + e.r) ** 2) hurt(e.d);
  }
  if (settings.mode !== "bossrush")
    updateHazards(hazards, dt, {
      time,
      W,
      H,
      player,
      bullets,
      enemyBullets,
      enemies,
      particles,
      hurt,
    });
  for (const b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    b.hit ??= new Set();
    for (const e of enemies) {
      if (e.hp <= 0 || b.hit.has(e)) continue;
      if (dist2(b, e) < (b.r + e.r) ** 2) {
        b.hit.add(e);
        e.hp -= b.damage * bossDamageMultiplier(e);
        e.flash = 0.06;
        onCompanionProjectileHit(b, e, enemies, player.weaponFx);
        b.pierce--;
        if (b.phaseMemory && b.pierce >= 0) b.damage *= 1.12;
        audio.hit();
        for (let i = 0; i < (b.kind === "missile" ? 8 : 3); i++)
          particles.push(
            particle(b.x, b.y, b.kind === "missile" ? "boss" : "spark"),
          );
        if (b.pierce < 0) {
          b.life = 0;
          break;
        }
      }
    }
  }
  for (const b of enemyBullets) {
    if (b.life <= 0) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (dist2(player, b) < (player.r + b.r) ** 2) {
      b.life = 0;
      hurt(b.damage);
    }
  }
  for (let i = enemies.length - 1; i >= 0; i--)
    if (enemies[i].hp <= 0) {
      awardKill(enemies[i], mods);
      enemies.splice(i, 1);
    }
  if (pendingBlackSignal) {
    chooseBlackSignal();
    return;
  }
  bullets = bullets.filter(
    (b) => b.life > 0 && b.x > -50 && b.y > -50 && b.x < W + 50 && b.y < H + 50,
  );
  enemyBullets = enemyBullets.filter(
    (b) => b.life > 0 && b.x > -70 && b.y > -70 && b.x < W + 70 && b.y < H + 70,
  );
  enemyBullets = regulateProjectilePressure(enemyBullets, {
    difficulty: settings.difficulty,
    time,
    width: W,
    height: H,
    player,
  });
  applyFriendlyVisualBudget(bullets, { width: W, height: H, player });
  gems = compressSalvage(gems, { width: W, height: H });
  const magnet = player.magnet * mods.magnet;
  for (let i = gems.length - 1; i >= 0; i--) {
    const g = gems[i],
      d = Math.sqrt(dist2(player, g));
    if (d < magnet) {
      const k = Math.max(0.1, 1 - d / magnet),
        a = Math.atan2(player.y - g.y, player.x - g.x);
      g.x += Math.cos(a) * (140 + 420 * k) * dt;
      g.y += Math.sin(a) * (140 + 420 * k) * dt;
    }
    if (d < player.r + 8) {
      player.xp += g.v * player.xpGain * mods.xp * specialGemMultiplier(player);
      audio.xp();
      gems.splice(i, 1);
      if (player.xp >= player.nextXp) {
        player.xp -= player.nextXp;
        player.level++;
        player.nextXp = Math.floor(player.nextXp * 1.28 + 8);
        levelUp();
        break;
      }
    }
  }
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.life -= dt;
    p.phase += dt * 2;
    attractPowerup(p, player, dt);
    if (dist2(player, p) < (player.r + p.r + 8) ** 2) {
      collectPowerup(p);
      powerups.splice(i, 1);
    } else if (p.life <= 0) powerups.splice(i, 1);
  }
  for (let o = 0; o < player.orbitals; o++) {
    const a = time * 2.1 + (o * Math.PI * 2) / player.orbitals,
      ox = player.x + Math.cos(a) * 42,
      oy = player.y + Math.sin(a) * 42;
    for (const e of enemies)
      if (dist2({ x: ox, y: oy }, e) < (8 + e.r) ** 2) e.hp -= 28 * dt;
  }
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);
  shake = Math.max(0, shake - 30 * dt);
  updateUI();
}
function updateUI() {
  if (!player) return;
  ui.hp.textContent = Math.max(0, Math.ceil(player.hp));
  ui.level.textContent = player.level;
  ui.time.textContent =
    String(Math.floor(time / 60)).padStart(2, "0") +
    ":" +
    String(Math.floor(time % 60)).padStart(2, "0");
  ui.score.textContent = Math.floor(score);
  ui.hpBar.style.width = (player.hp / player.maxHp) * 100 + "%";
  ui.xpBar.style.width = (player.xp / player.nextXp) * 100 + "%";
  const mult = 1 + Math.min(combo, 30) * 0.03;
  ui.combo.textContent = "COMBO x" + mult.toFixed(2);
  ui.combo.classList.toggle("hot", combo >= 3);
  ui.arsenal.textContent = compactArsenalLabel(
    player,
    activeSynergies(player),
    weaponLabel(player),
  );
  ui.sector.textContent =
    settings.mode === "bossrush" ? "BOSS CIRCUIT" : sectorAt(time).name;
  ui.objective.textContent =
    settings.mode === "bossrush"
      ? "BOSS " + (bossCount + 1) + " INBOUND"
      : objectiveFor(settings.mode);
  const boss = enemies.find((e) => e.boss);
  ui.bossName.textContent = boss
    ? boss.bossName + (boss.bossPhase === 2 ? " // PHASE II" : "")
    : "";
}
function render() {
  renderScene(
    ctx,
    { dpr, W, H },
    {
      time,
      shake: settings.shake ? shake : 0,
      state,
      player,
      enemies,
      bullets,
      enemyBullets,
      gems,
      particles,
      powerups,
      hazards: settings.mode === "bossrush" ? null : hazards,
      events: settings.mode === "bossrush" ? null : events,
    },
  );
}
function frame(ts) {
  const dt = Math.min(0.033, (ts - last) / 1000 || 0);
  last = ts;
  try {
    update(dt);
    render();
  } catch (error) {
    showFatal(error);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

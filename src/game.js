import { AudioSystem } from "./audio.js";
import { clamp } from "./entities.js";
import { randomChoices } from "./upgrades.js";
import { MODULE_POOLS, modulePoolForLevel } from "./module-catalog.js";
import { initWeapons } from "./weapons.js";
import { createInput } from "./input.js";
import { renderScene } from "./render.js";
import { createBossRuntime } from "./boss-runtime.js";
import { loadSettings, saveSettings, loadStats, recordRun } from "./meta.js";
import { createHazardState } from "./hazards.js";
import { createEventState } from "./events.js";
import { applyShip } from "./ships.js";
import { bossInterval, preparePlayerForMode } from "./modes.js";
import {
  createRouteState,
  createRouteUI,
  renderRouteChoice,
  routeChoices,
  routeLeg,
  selectRoute,
  updateRouteBadge,
} from "./sector-routes.js";
import { onSpecialLevelUp, specialChoiceCount } from "./special-modules.js";
import {
  acceptBlackSignal,
  blackSignalOffers,
  createBlackSignalUI,
  renderBlackSignal,
} from "./black-signal.js";
import { discover, recordArchiveRun } from "./discovery.js";
import { activeSynergies } from "./synergy-catalog.js";
import { attractPowerup } from "./drop-economy.js";
import { createExpeditionState } from "./expedition.js";
import { createExpeditionEncounterRuntime } from "./expedition-encounters.js";
import { updateGame } from "./game-runtime.js";
import { createExpeditionController } from "./expedition-runtime.js";
import { collectGameUi, createMenuController, updateHud } from "./game-ui.js";
import { createFreshPlayer } from "./player-state.js";
import { createCombatActions } from "./combat-actions.js";
const routeUi = createRouteUI();
const blackSignalUi = createBlackSignalUI();
const canvas = document.querySelector("#game"),
  ctx = canvas.getContext("2d");
const ui = collectGameUi(routeUi.panel, blackSignalUi.panel);
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
  expedition = null,
  bossRuntime = createBossRuntime(),
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
function noteDiscovery(kind, id) {
  if (discover(kind, id)) runDiscoveries.push({ kind, id });
}
function syncSynergyDiscoveries() {
  for (const synergy of activeSynergies(player))
    noteDiscovery("synergies", synergy.id);
}
const hidePanels = () => menuController.hidePanels();
const showPanel = (panel) => menuController.showPanel(panel);
const refreshSettings = () => menuController.refreshSettings();
const refreshStats = () => menuController.refreshStats();
const refreshShip = () => menuController.refreshShip();
const refreshMode = () => menuController.refreshMode();
function start() {
  try {
    settings = loadSettings();
    try {
      audio.ensure();
    } catch (err) {
      console.warn("Audio unavailable", err);
    }
    player = applyShip(createFreshPlayer(W, H), settings.ship);
    initWeapons(player);
    preparePlayerForMode(player, settings.mode);
    enemies = [];
    bullets = [];
    enemyBullets = [];
    gems = [];
    particles = [];
    powerups = [];
    bossRuntime = createBossRuntime();
    hazards = createHazardState();
    events = createEventState();
    routes = createRouteState();
    expedition =
      settings.mode === "expedition"
        ? createExpeditionState(settings.difficulty, player)
        : null;
    if (expedition)
      expedition.encounterRuntime = createExpeditionEncounterRuntime(
        expedition.encounterId,
        W,
        H,
        expedition.random,
      );
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
    expedition: expedition
      ? {
          sector: expedition.sector,
          rooms: expedition.roomsCleared,
          path: [...expedition.history],
          secrets: expedition.secretsFound,
          scrap: expedition.credits,
        }
      : null,
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
  if (settings.mode === "expedition") return;
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
const shoot = () => combatActions.shoot();
const hurt = (amount) => combatActions.hurt(amount);
const awardKill = (enemy, mods) => combatActions.awardKill(enemy, mods);
const collectPowerup = (powerup) => combatActions.collectPowerup(powerup);
const runtime = {
  get state() {
    return state;
  },
  get time() {
    return time;
  },
  set time(value) {
    time = value;
  },
  get score() {
    return score;
  },
  set score(value) {
    score = value;
  },
  get kills() {
    return kills;
  },
  set kills(value) {
    kills = value;
  },
  get killsSinceRepair() {
    return killsSinceRepair;
  },
  set killsSinceRepair(value) {
    killsSinceRepair = value;
  },
  get defeatedBosses() {
    return defeatedBosses;
  },
  get settings() {
    return settings;
  },
  get stats() {
    return stats;
  },
  set stats(value) {
    stats = value;
  },
  get routes() {
    return routes;
  },
  get events() {
    return events;
  },
  get encounteredEvents() {
    return encounteredEvents;
  },
  get player() {
    return player;
  },
  get input() {
    return input;
  },
  get enemies() {
    return enemies;
  },
  set enemies(value) {
    enemies = value;
  },
  get bullets() {
    return bullets;
  },
  set bullets(value) {
    bullets = value;
  },
  get enemyBullets() {
    return enemyBullets;
  },
  set enemyBullets(value) {
    enemyBullets = value;
  },
  get particles() {
    return particles;
  },
  set particles(value) {
    particles = value;
  },
  get gems() {
    return gems;
  },
  set gems(value) {
    gems = value;
  },
  get powerups() {
    return powerups;
  },
  set powerups(value) {
    powerups = value;
  },
  get expedition() {
    return expedition;
  },
  get bossRuntime() {
    return bossRuntime;
  },
  get hazards() {
    return hazards;
  },
  set hazards(value) {
    hazards = value;
  },
  get contractHistory() {
    return contractHistory;
  },
  get width() {
    return W;
  },
  get height() {
    return H;
  },
  get spawnTimer() {
    return spawnTimer;
  },
  set spawnTimer(value) {
    spawnTimer = value;
  },
  get nextBoss() {
    return nextBoss;
  },
  set nextBoss(value) {
    nextBoss = value;
  },
  get bossCount() {
    return bossCount;
  },
  set bossCount(value) {
    bossCount = value;
  },
  get combo() {
    return combo;
  },
  set combo(value) {
    combo = value;
  },
  get comboTimer() {
    return comboTimer;
  },
  set comboTimer(value) {
    comboTimer = value;
  },
  get shake() {
    return shake;
  },
  set shake(value) {
    shake = value;
  },
  get pendingBlackSignal() {
    return pendingBlackSignal;
  },
  set pendingBlackSignal(value) {
    pendingBlackSignal = value;
  },
  ui,
  audio,
  start,
  routesEnabled,
  chooseSectorRoute,
  noteDiscovery,
  syncSynergyDiscoveries,
  shoot,
  updateExpedition: (dt) => expeditionController.update(dt),
  hurt,
  awardKill,
  chooseBlackSignal,
  levelUp,
  collectPowerup,
  attractPowerup,
  finish,
  updateUI,
};
const combatActions = createCombatActions(runtime);
const expeditionController = createExpeditionController(runtime);
const menuController = createMenuController(runtime);
menuController.bind();
refreshStats();
refreshSettings();
refreshShip();
refreshMode();

function update(dt) {
  updateGame(runtime, dt);
}
function updateUI() {
  updateHud(ui, runtime);
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
      expedition,
      sectorTime: expedition ? (expedition.sector - 1) * 120 : time,
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

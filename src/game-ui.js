import { loadStats, resetStats, saveSettings } from "./meta.js";
import { SHIPS, unlockedShips, shipById } from "./ships.js";
import { MODES, unlockedModes, modeById, objectiveFor } from "./modes.js";
import { sectorAt } from "./world.js";
import { expeditionObjective } from "./expedition.js";
import { activeSynergies } from "./synergy-catalog.js";
import { compactArsenalLabel } from "./hud-summary.js";
import { weaponLabel } from "./weapons.js";

export function collectGameUi(routePanel, blackSignalPanel) {
  const byId = (id) => document.querySelector(`#${id}`);
  return {
    overlay: byId("overlay"),
    menu: byId("menu"),
    settings: byId("settings"),
    stats: byId("stats"),
    levelup: byId("levelup"),
    route: routePanel,
    blackSignal: blackSignalPanel,
    gameover: byId("gameover"),
    victory: byId("victory"),
    fatal: byId("fatal"),
    fatalMessage: byId("fatalMessage"),
    choices: byId("choices"),
    hp: byId("hp"),
    level: byId("level"),
    time: byId("time"),
    score: byId("score"),
    hpBar: byId("hpBar"),
    xpBar: byId("xpBar"),
    combo: byId("combo"),
    arsenal: byId("arsenal"),
    sector: byId("sector"),
    objective: byId("objective"),
    bossName: byId("bossName"),
    best: byId("best"),
    finalScore: byId("finalScore"),
    victoryScore: byId("victoryScore"),
    difficulty: byId("difficultySetting"),
    shake: byId("shakeSetting"),
    sound: byId("soundSetting"),
    statRuns: byId("statRuns"),
    statWins: byId("statWins"),
    statKills: byId("statKills"),
    statBest: byId("statBest"),
    shipSelect: byId("shipSelect"),
    shipDesc: byId("shipHeroDesc"),
    modeSelect: byId("modeSelect"),
    modeDesc: byId("modeDesc"),
    nextUnlock: byId("nextUnlock"),
  };
}

export function createMenuController(runtime) {
  const { ui } = runtime;
  const panels = [
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

  function hidePanels() {
    for (const panel of panels) panel?.classList.add("hidden");
  }

  function showPanel(panel) {
    hidePanels();
    panel.classList.remove("hidden");
    ui.overlay.classList.add("show");
  }

  function refreshSettings() {
    const settings = runtime.settings;
    ui.difficulty.querySelector("b").textContent =
      settings.difficulty.toUpperCase();
    ui.shake.querySelector("b").textContent = settings.shake ? "ON" : "OFF";
    ui.sound.querySelector("b").textContent = settings.sound ? "ON" : "OFF";
  }

  function refreshStats() {
    const stats = loadStats();
    runtime.stats = stats;
    ui.best.textContent = Math.max(
      stats.best,
      Number(localStorage.getItem("orbital-best") || 0),
    );
    ui.statRuns.textContent = stats.runs;
    ui.statWins.textContent = stats.wins;
    ui.statKills.textContent = stats.kills;
    ui.statBest.textContent = stats.best;
    const availableShips = unlockedShips(stats);
    const availableModes = unlockedModes(stats);
    const lockedShips = SHIPS.filter(
      (ship) => !availableShips.some((item) => item.id === ship.id),
    );
    const lockedModes = MODES.filter(
      (mode) => !availableModes.some((item) => item.id === mode.id),
    );
    const notes = [];
    if (lockedShips.length)
      notes.push(
        `Next chassis: ${lockedShips[0].name} — ${lockedShips[0].unlock}`,
      );
    if (lockedModes.length)
      notes.push(
        `Next mode: ${lockedModes[0].name} — ${lockedModes[0].unlock}`,
      );
    ui.nextUnlock.textContent = notes.length
      ? notes.join(" · ")
      : "All current chassis and modes unlocked.";
  }

  function refreshShip() {
    const available = unlockedShips(runtime.stats);
    if (!available.some((ship) => ship.id === runtime.settings.ship)) {
      runtime.settings.ship = "strider";
      saveSettings(runtime.settings);
    }
    const ship = shipById(runtime.settings.ship);
    ui.shipSelect.querySelector("[data-ship-name]").textContent = ship.name;
    ui.shipDesc.textContent = ship.desc;
  }

  function refreshMode() {
    const available = unlockedModes(runtime.stats);
    if (!available.some((mode) => mode.id === runtime.settings.mode)) {
      runtime.settings.mode = "expedition";
      saveSettings(runtime.settings);
    }
    const mode = modeById(runtime.settings.mode);
    ui.modeSelect.querySelector("b").textContent = mode.name;
    ui.modeDesc.textContent = mode.desc;
    ui.objective.textContent = objectiveFor(mode.id);
  }

  function showMenu() {
    showPanel(ui.menu);
    refreshStats();
    refreshSettings();
    refreshShip();
    refreshMode();
  }

  function bind() {
    document.querySelector("#start").onclick = runtime.start;
    document.querySelector("#restart").onclick = runtime.start;
    document.querySelector("#victoryRestart").onclick = runtime.start;
    document
      .querySelector("#fatalRestart")
      ?.addEventListener("click", () => location.reload());
    ui.difficulty.onclick = () => {
      runtime.settings.difficulty =
        runtime.settings.difficulty === "normal"
          ? "intense"
          : runtime.settings.difficulty === "intense"
            ? "chill"
            : "normal";
      saveSettings(runtime.settings);
      refreshSettings();
    };
    ui.shake.onclick = () => {
      runtime.settings.shake = !runtime.settings.shake;
      saveSettings(runtime.settings);
      refreshSettings();
    };
    ui.sound.onclick = () => {
      runtime.settings.sound = !runtime.settings.sound;
      runtime.audio.muted = !runtime.settings.sound;
      saveSettings(runtime.settings);
      refreshSettings();
    };
    ui.modeSelect.onclick = () => {
      const available = unlockedModes(runtime.stats);
      const index = Math.max(
        0,
        available.findIndex((mode) => mode.id === runtime.settings.mode),
      );
      runtime.settings.mode = available[(index + 1) % available.length].id;
      saveSettings(runtime.settings);
      refreshMode();
    };
    document.querySelector("#resetStats").onclick = () => {
      runtime.stats = resetStats();
      runtime.settings.ship = "strider";
      runtime.settings.mode = "expedition";
      saveSettings(runtime.settings);
      refreshStats();
      refreshShip();
      refreshMode();
    };
  }

  return {
    bind,
    hidePanels,
    refreshMode,
    refreshSettings,
    refreshShip,
    refreshStats,
    showMenu,
    showPanel,
  };
}

export function updateHud(ui, runtime) {
  const { player, expedition, settings } = runtime;
  if (!player) return;
  ui.hp.textContent = Math.max(0, Math.ceil(player.hp));
  ui.level.textContent = player.level;
  ui.time.textContent =
    String(Math.floor(runtime.time / 60)).padStart(2, "0") +
    ":" +
    String(Math.floor(runtime.time % 60)).padStart(2, "0");
  ui.score.textContent = Math.floor(runtime.score);
  ui.hpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
  ui.xpBar.style.width = expedition
    ? `${
        expedition.phase === "combat"
          ? Math.min(
              100,
              (expedition.wave / Math.max(1, expedition.waves)) * 100,
            )
          : 100
      }%`
    : `${(player.xp / player.nextXp) * 100}%`;
  const multiplier = 1 + Math.min(runtime.combo, 30) * 0.03;
  ui.combo.textContent = `COMBO x${multiplier.toFixed(2)}`;
  ui.combo.classList.toggle("hot", runtime.combo >= 3);
  ui.arsenal.textContent = compactArsenalLabel(
    player,
    activeSynergies(player),
    weaponLabel(player),
  );
  ui.sector.textContent =
    settings.mode === "bossrush"
      ? "BOSS CIRCUIT"
      : expedition
        ? `SECTOR ${expedition.sector} · ROOM ${expedition.room} · ${expedition.credits} SCRAP`
        : sectorAt(runtime.time).name;
  ui.objective.textContent = expedition
    ? expeditionObjective(expedition)
    : settings.mode === "bossrush"
      ? `BOSS ${runtime.bossCount + 1} INBOUND`
      : objectiveFor(settings.mode);
  const boss = runtime.enemies.find((enemy) => enemy.boss);
  ui.bossName.textContent = boss
    ? boss.bossName + (boss.bossPhase === 2 ? " // PHASE II" : "")
    : "";
}

import { loadSettings, saveSettings, loadStats } from "./meta.js";
import { SHIPS, unlockedShips, shipById } from "./ships.js";
import { MODES, unlockedModes, modeById } from "./modes.js";
import { loadCore, CORE_UPGRADES } from "./core.js";
import { shipSvgMarkup } from "./ship-render.js";

const overlay = document.querySelector("#overlay");
const panels = [...document.querySelectorAll(".panel")];
const nav = [...document.querySelectorAll("[data-nav]")];
const shipButton = document.querySelector("#shipSelect");
const modeButton = document.querySelector("#modeSelect");
const difficulty = document.querySelector("#difficultySetting");
const homeDifficulty = document.querySelector("#homeDifficulty");
const difficultyDesc = document.querySelector("#difficultyDesc");
const launchSummary = document.querySelector("#launchSummary");
const shipArt = document.querySelector("#shipArt");
const shipName = document.querySelector("#shipHeroName");
const shipDesc = document.querySelector("#shipHeroDesc");
const coreHome = document.querySelector("#homeCoreShards");
const coreLevel = document.querySelector("#homeCoreLevel");
const bestHome = document.querySelector("#homeBest");
const hangarTrack = document.querySelector("#hangarTrack");
const DIFFICULTY_COPY = {
  chill: "Simple bosses · generous drops",
  normal: "Harder bosses · clean arenas",
  intense: "Full swarms · scarce recovery",
};
const gameplayPanels = new Set([
  "pause",
  "route",
  "blackSignal",
  "levelup",
  "gameover",
  "victory",
  "fatal",
]);
let settings = loadSettings();
function syncOverlayMode() {
  const active = panels.find((p) => !p.classList.contains("hidden"));
  overlay.classList.toggle(
    "gameplay-modal",
    !!active && gameplayPanels.has(active.id),
  );
}
function show(id) {
  panels.forEach((p) => p.classList.toggle("hidden", p.id !== id));
  overlay.classList.add("show");
  const navTarget = ["stats", "settings", "playground"].includes(id)
    ? "more"
    : id;
  nav.forEach((b) => {
    const active = b.dataset.nav === navTarget;
    b.classList.toggle("active", active);
    if (active) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  syncOverlayMode();
  if (id === "hangar") renderHangar();
  if (id === "menu") renderHome();
}
function coreTotal() {
  const core = loadCore();
  return CORE_UPGRADES.reduce((sum, u) => sum + (core.levels[u.id] || 0), 0);
}
function renderHome() {
  settings = loadSettings();
  const stats = loadStats(),
    ship = shipById(settings.ship),
    mode = modeById(settings.mode),
    core = loadCore();
  shipName.textContent = ship.name;
  shipDesc.textContent = ship.desc;
  shipArt.innerHTML = shipSvgMarkup(ship);
  coreHome.textContent = core.shards;
  coreLevel.textContent = coreTotal();
  bestHome.textContent = Math.max(
    stats.best,
    Number(localStorage.getItem("orbital-best") || 0),
  );
  launchSummary.innerHTML = `<b>${mode.name}</b><span>${settings.difficulty.toUpperCase()}</span>`;
  homeDifficulty.querySelector("b").textContent =
    settings.difficulty.toUpperCase();
  difficultyDesc.textContent = DIFFICULTY_COPY[settings.difficulty];
  const moreVersion = document.querySelector("#moreVersion");
  if (moreVersion)
    moreVersion.textContent = `VERSION ${globalThis.ORBITAL_APP_VERSION || "DEV"}`;
}
function renderHangar() {
  const stats = loadStats(),
    available = new Set(unlockedShips(stats).map((s) => s.id));
  hangarTrack.innerHTML = "";
  for (const ship of SHIPS) {
    const unlocked = available.has(ship.id),
      card = document.createElement("button");
    card.className =
      "hangar-card" +
      (settings.ship === ship.id ? " selected" : "") +
      (unlocked ? "" : " locked");
    card.innerHTML = `<div class="mini-ship" data-ship="${ship.id}">${shipSvgMarkup(ship)}</div><span class="hangar-state">${unlocked ? (settings.ship === ship.id ? "EQUIPPED" : "AVAILABLE") : "LOCKED"}</span><strong>${ship.name}</strong><span class="hangar-role">${ship.role}</span><div class="ship-statline">${ship.stats.map((stat) => `<b>${stat}</b>`).join("")}</div><small>${ship.desc}</small><em>${unlocked ? "TAP TO EQUIP" : ship.unlock}</em>`;
    card.disabled = !unlocked;
    card.onclick = () => {
      settings.ship = ship.id;
      saveSettings(settings);
      renderHangar();
      renderHome();
    };
    hangarTrack.appendChild(card);
  }
}
nav.forEach((b) => b.addEventListener("click", () => show(b.dataset.nav)));
document
  .querySelector("#openCore")
  ?.addEventListener("click", () => show("core"));
document
  .querySelector("#openSettings")
  ?.addEventListener("click", () => show("settings"));
document
  .querySelector("#openStats")
  ?.addEventListener("click", () => show("stats"));
document
  .querySelector("#openHangar")
  ?.addEventListener("click", () => show("hangar"));
shipButton?.addEventListener("click", () => show("hangar"));
modeButton?.addEventListener("click", () => setTimeout(renderHome, 0));
difficulty?.addEventListener("click", () => setTimeout(renderHome, 0));
homeDifficulty?.addEventListener("click", () => {
  settings = loadSettings();
  settings.difficulty =
    settings.difficulty === "normal"
      ? "intense"
      : settings.difficulty === "intense"
        ? "chill"
        : "normal";
  saveSettings(settings);
  renderHome();
});
document
  .querySelectorAll(".back,.core-back")
  .forEach((b) =>
    b.addEventListener("click", () => show(b.dataset.back || "menu")),
  );
document.addEventListener("orbital:show-panel", (e) => show(e.detail));
for (const panel of panels)
  new MutationObserver(syncOverlayMode).observe(panel, {
    attributes: true,
    attributeFilter: ["class"],
  });
window.addEventListener("storage", renderHome);
syncOverlayMode();
renderHome();

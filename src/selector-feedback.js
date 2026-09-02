import { loadStats } from "./meta.js";
import { SHIPS, unlockedShips } from "./ships.js";
import { MODES, unlockedModes } from "./modes.js";

const shipButton = document.querySelector("#shipSelect");
const modeButton = document.querySelector("#modeSelect");
const status = document.querySelector("#selectorStatus");
let timer = null;
function nextLocked(all, unlocked) {
  const ids = new Set(unlocked.map((item) => item.id));
  return all.find((item) => !ids.has(item.id));
}
function summary() {
  const stats = loadStats(),
    ships = unlockedShips(stats),
    modes = unlockedModes(stats),
    shipNext = nextLocked(SHIPS, ships),
    modeNext = nextLocked(MODES, modes);
  const bits = [
    `${ships.length}/${SHIPS.length} chassis`,
    `${modes.length}/${MODES.length} modes`,
  ];
  if (shipNext) bits.push(`next: ${shipNext.name} · ${shipNext.unlock}`);
  else if (modeNext) bits.push(`next: ${modeNext.name} · ${modeNext.unlock}`);
  return bits.join("  ·  ");
}
function show(message) {
  if (!status) return;
  clearTimeout(timer);
  status.textContent = message;
  status.classList.add("active");
  timer = setTimeout(() => {
    status.textContent = summary();
    status.classList.remove("active");
  }, 2200);
}
function refresh() {
  if (!shipButton || !modeButton || !status) return;
  const stats = loadStats(),
    ships = unlockedShips(stats),
    modes = unlockedModes(stats);
  status.textContent = summary();
  shipButton.dataset.single = ships.length < 2 ? "true" : "false";
  modeButton.dataset.single = modes.length < 2 ? "true" : "false";
}
shipButton?.addEventListener("click", () => {
  const stats = loadStats(),
    ships = unlockedShips(stats),
    next = nextLocked(SHIPS, ships);
  if (ships.length < 2 && next)
    show(`${next.name} unlocks when you ${next.unlock.toLowerCase()}.`);
});
modeButton?.addEventListener("click", () => {
  const stats = loadStats(),
    modes = unlockedModes(stats),
    next = nextLocked(MODES, modes);
  if (modes.length < 2 && next)
    show(`${next.name} unlocks when you ${next.unlock.toLowerCase()}.`);
  else setTimeout(refresh, 0);
});
refresh();

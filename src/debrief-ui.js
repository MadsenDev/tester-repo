import { lastArchiveRun } from "./discovery.js";
import { moduleById } from "./module-catalog.js";
import { SECTOR_ROUTES } from "./sector-routes.js";
import { SYNERGY_CATALOG } from "./synergy-catalog.js";

const panels = ["gameover", "victory"]
  .map((id) => document.querySelector(`#${id}`))
  .filter(Boolean);

const moduleName = (id) => moduleById(id)?.name || id;
const routeName = (id) =>
  SECTOR_ROUTES.find((route) => route.id === id)?.name || id;
const synergyName = (id) =>
  SYNERGY_CATALOG.find((synergy) => synergy.id === id)?.name || id;

function ensure(panel) {
  let debrief = panel.querySelector(".run-debrief");
  if (!debrief) {
    debrief = document.createElement("section");
    debrief.className = "run-debrief";
    panel.querySelector(".result-actions")?.before(debrief);
  }
  const actions = panel.querySelector(".result-actions");
  if (actions && !actions.querySelector(".result-archive")) {
    const button = document.createElement("button");
    button.className = "secondary result-archive";
    button.textContent = "VIEW ARCHIVE";
    button.addEventListener("click", () =>
      document.querySelector('[data-nav="archive"]')?.click(),
    );
    actions.insertBefore(button, actions.lastElementChild);
  }
  return debrief;
}

function render(panel, run = lastArchiveRun()) {
  if (!run) return;
  const debrief = ensure(panel),
    modules = run.modules.map(moduleName),
    routes = run.routes.map(routeName),
    synergies = run.synergies.map(synergyName),
    discoveries = run.newly || [],
    routeSummary = run.expedition
      ? `${run.expedition.rooms} ROOMS · ${run.expedition.secrets} SECRET${run.expedition.secrets === 1 ? "" : "S"} · ${run.expedition.scrap} SCRAP`
      : routes.join(" → ") || "UNCHARTED";
  debrief.innerHTML = `
    <div class="debrief-heading"><span>FINAL LOADOUT</span><b>${modules.length} MODULE${modules.length === 1 ? "" : "S"}</b></div>
    <p class="debrief-build">${modules.slice(0, 8).join(" · ") || "BLASTER ONLY"}${modules.length > 8 ? ` · +${modules.length - 8} MORE` : ""}</p>
    ${synergies.length ? `<div class="debrief-synergies">${synergies.map((name) => `<span>${name}</span>`).join("")}</div>` : ""}
    <dl><div><dt>${run.expedition ? "EXPEDITION" : "ROUTE"}</dt><dd>${routeSummary}</dd></div><div><dt>BLACK SIGNALS</dt><dd>${run.contracts.length}</dd></div></dl>
    ${discoveries.length ? `<p class="debrief-new">NEW ARCHIVE DATA · ${discoveries.length} SIGNAL${discoveries.length === 1 ? "" : "S"}</p>` : ""}`;
}

window.addEventListener("orbital:run-finished", (event) => {
  for (const panel of panels) render(panel, event.detail);
});
for (const panel of panels) {
  ensure(panel);
  new MutationObserver(() => {
    if (!panel.classList.contains("hidden")) render(panel);
  }).observe(panel, { attributes: true, attributeFilter: ["class"] });
}

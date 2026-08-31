import { BOSSES } from "./bosses.js";
import { EVENTS } from "./events.js";
import { MODULES, MODULE_POOLS, modulePool } from "./module-catalog.js";
import { loadArchive } from "./discovery.js";
import { MODES } from "./modes.js";
import { SECTOR_ROUTES } from "./sector-routes.js";
import { SHIPS } from "./ships.js";
import { SYNERGY_CATALOG } from "./synergy-catalog.js";

const panel = document.querySelector("#archive"),
  content = document.querySelector("#archiveContent"),
  progress = document.querySelector("#archiveProgress"),
  search = document.querySelector("#archiveSearch"),
  tabs = [...document.querySelectorAll("[data-archive-tab]")];
let activeTab = "modules";

const known = (archive, kind, id) => archive[kind]?.includes(id);
const timeLabel = (seconds = 0) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

function lockedCard(label = "UNKNOWN SIGNAL") {
  return `<article class="archive-card locked"><span>UNDECIPHERED</span><h3>${label}</h3><p>Encounter this signal during a run to reveal its record.</p></article>`;
}

function renderModules(archive) {
  const query = search.value.trim().toLowerCase(),
    modules = MODULES.filter(
      (module) =>
        !query ||
        module.name.toLowerCase().includes(query) ||
        module.tags.some((tag) => tag.includes(query)),
    );
  content.innerHTML = `<div class="archive-grid module-archive-grid">${modules
    .map((module) => {
      if (!known(archive, "modules", module.id)) return lockedCard();
      const pool = modulePool(module),
        meta = MODULE_POOLS[pool];
      return `<article class="archive-card" style="--archive-color:${meta.color}"><span>${meta.name} · ${module.rarity}</span><h3>${module.name}</h3><p>${module.desc}</p><small>${module.tags.join(" · ") || "SYSTEM"}</small></article>`;
    })
    .join("")}</div>`;
}

function renderSynergies(archive) {
  content.innerHTML = `<div class="archive-grid synergy-archive-grid">${SYNERGY_CATALOG.map(
    (synergy) => {
      const discovered = known(archive, "synergies", synergy.id);
      if (!discovered && synergy.apex) return lockedCard("APEX SIGNAL ???");
      return `<article class="archive-card synergy-card ${discovered ? "decoded" : "hinted"}"><span>${synergy.apex ? "APEX TRANSFORMATION" : "BLASTER INTERACTION"}</span><h3>${synergy.name}</h3><p>${synergy.requires}</p><small>${discovered ? "DECODED" : "SIGNAL PREDICTED"}</small></article>`;
    },
  ).join("")}</div>`;
}

function threatGroup(title, entries, archive, kind, id, body) {
  return `<section class="archive-threat-group"><h3>${title}</h3><div class="archive-grid">${entries
    .map((entry) =>
      known(archive, kind, id(entry))
        ? `<article class="archive-card"><span>RECORDED</span><h3>${entry.name}</h3><p>${body(entry)}</p></article>`
        : lockedCard(),
    )
    .join("")}</div></section>`;
}

function renderThreats(archive) {
  content.innerHTML =
    threatGroup(
      "Boss encounters",
      BOSSES,
      archive,
      "bosses",
      (boss) => boss.kind,
      (boss) => `Hull signature ${boss.hp} · Contact damage ${boss.d}`,
    ) +
    threatGroup(
      "Sector routes",
      SECTOR_ROUTES,
      archive,
      "routes",
      (route) => route.id,
      (route) => `${route.reward} ${route.threat}`,
    ) +
    threatGroup(
      "Sector events",
      EVENTS,
      archive,
      "events",
      (event) => event.id,
      (event) => event.desc,
    );
}

function completionMarks(archive) {
  return `<section class="completion-board"><h3>Completion marks</h3><div class="completion-grid">${SHIPS.map(
    (ship) =>
      `<article><strong>${ship.name}</strong>${MODES.map((mode) => {
        const mark = archive.completion?.[ship.id]?.[mode.id];
        return `<span class="${mark ? "complete" : ""}">${mode.name}<b>${mark ? `${mark.wins} WIN${mark.wins === 1 ? "" : "S"}` : "—"}</b></span>`;
      }).join("")}</article>`,
  ).join("")}</div></section>`;
}

function renderRuns(archive) {
  const runs = archive.runs.length
    ? archive.runs
        .map(
          (run) => `<article class="archive-run ${run.won ? "won" : "lost"}">
        <div><span>${run.won ? "ORBIT STABILIZED" : "SIGNAL LOST"}</span><h3>${run.ship?.toUpperCase()} · ${run.mode?.toUpperCase()}</h3></div>
        <dl><div><dt>SCORE</dt><dd>${run.score}</dd></div><div><dt>TIME</dt><dd>${timeLabel(run.time)}</dd></div><div><dt>KILLS</dt><dd>${run.kills}</dd></div><div><dt>BUILD</dt><dd>${run.modules.length}</dd></div></dl>
        <p>${run.synergies.length ? run.synergies.map((id) => SYNERGY_CATALOG.find((item) => item.id === id)?.name || id).join(" · ") : "No decoded synergies"}</p>
      </article>`,
        )
        .join("")
    : `<p class="archive-empty">No completed transmissions yet. Launch a run to begin the record.</p>`;
  content.innerHTML =
    completionMarks(archive) +
    `<section class="run-history"><h3>Recent runs</h3>${runs}</section>`;
}

function render() {
  const archive = loadArchive(),
    discovered = archive.modules.length,
    total = MODULES.length;
  progress.textContent = `${discovered} / ${total} MODULES`;
  search.classList.toggle("hidden", activeTab !== "modules");
  tabs.forEach((tab) =>
    tab.classList.toggle("active", tab.dataset.archiveTab === activeTab),
  );
  if (activeTab === "modules") renderModules(archive);
  else if (activeTab === "synergies") renderSynergies(archive);
  else if (activeTab === "threats") renderThreats(archive);
  else renderRuns(archive);
}

tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    activeTab = tab.dataset.archiveTab;
    render();
  }),
);
search?.addEventListener("input", () => renderModules(loadArchive()));
document
  .querySelector('[data-nav="archive"]')
  ?.addEventListener("click", () => requestAnimationFrame(render));
window.addEventListener("orbital:discovery", render);
panel && render();

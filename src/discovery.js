const ARCHIVE_KEY = "orbital-signal-archive-v1";
const KINDS = ["modules", "bosses", "routes", "events", "synergies"];

const defaults = () => ({
  modules: [],
  bosses: [],
  routes: [],
  events: [],
  synergies: [],
  contracts: 0,
  completion: {},
  runs: [],
});

export function loadArchive() {
  try {
    const stored = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "{}");
    const archive = { ...defaults(), ...stored };
    for (const kind of KINDS)
      archive[kind] = [
        ...new Set(Array.isArray(archive[kind]) ? archive[kind] : []),
      ];
    archive.completion ??= {};
    archive.runs = Array.isArray(archive.runs) ? archive.runs.slice(0, 12) : [];
    return archive;
  } catch {
    return defaults();
  }
}

export function saveArchive(archive) {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
  return archive;
}

export function discover(kind, id) {
  if (!id || !KINDS.includes(kind)) return false;
  const archive = loadArchive();
  if (archive[kind].includes(id)) return false;
  archive[kind].push(id);
  saveArchive(archive);
  if (typeof CustomEvent !== "undefined")
    globalThis.dispatchEvent?.(
      new CustomEvent("orbital:discovery", { detail: { kind, id } }),
    );
  return true;
}

export function discoverMany(kind, ids = []) {
  const archive = loadArchive(),
    known = new Set(archive[kind] || []),
    added = [];
  for (const id of ids.filter(Boolean))
    if (!known.has(id)) {
      known.add(id);
      added.push(id);
    }
  if (!added.length) return added;
  archive[kind] = [...known];
  saveArchive(archive);
  return added;
}

export function recordContract() {
  const archive = loadArchive();
  archive.contracts++;
  saveArchive(archive);
}

export function recordArchiveRun(run) {
  const archive = loadArchive(),
    newly = [];
  for (const kind of KINDS) {
    const known = new Set(archive[kind]);
    for (const id of run[kind] || [])
      if (id && !known.has(id)) {
        known.add(id);
        newly.push({ kind, id });
      }
    archive[kind] = [...known];
  }
  if (run.won) {
    const ship = (archive.completion[run.ship] ??= {}),
      mode = (ship[run.mode] ??= { wins: 0, best: 0 });
    mode.wins++;
    mode.best = Math.max(mode.best, run.score || 0);
  }
  const saved = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    at: new Date().toISOString(),
    won: !!run.won,
    ship: run.ship,
    mode: run.mode,
    score: Math.floor(run.score || 0),
    kills: run.kills || 0,
    time: Math.floor(run.time || 0),
    level: run.level || 1,
    modules: [...(run.modules || [])],
    routes: [...(run.routes || [])],
    bosses: [...(run.bosses || [])],
    synergies: [...(run.synergies || [])],
    contracts: [...(run.contracts || [])],
    expedition: run.expedition
      ? { ...run.expedition, path: [...(run.expedition.path || [])] }
      : null,
    newly: [...(run.newly || []), ...newly].filter(
      (item, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.kind === item.kind && candidate.id === item.id,
        ) === index,
    ),
  };
  archive.runs.unshift(saved);
  archive.runs = archive.runs.slice(0, 12);
  saveArchive(archive);
  return saved;
}

export const lastArchiveRun = () => loadArchive().runs[0] || null;

export function resetArchive() {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(defaults()));
  return defaults();
}

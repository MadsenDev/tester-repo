import { SPECIAL_MODULES } from "./special-modules.js";

const names =
  `Hot Core|Cold Forge|Redline Coil|Pulse Divider|Rail Accelerator|Dense Slug|Split Bus|Trident Relay|Phase Jacket|Ghost Bore|Lucky Circuit|Loaded Die|Guidance Kernel|Arc Imprint|Nova Imprint|Gravity Anchor|Prism Imprint|Glass Reactor|Gyro Stabilizer|Ion Choke|Reinforced Hull|Titanium Ribs|Emergency Foam|Repair Nanites|Reactive Plating|Ablative Shell|Vector Thrusters|Afterburner|Slipstream|Gravity Well|Signal Harvest|Black Box|Combat Medic|Thin Skin|Heavy Frame|Razor Orbit|Aegis Halo|Ember Familiar|Void Wisp|Gundrone|Saw Moon|Needle Satellite|Halo Shard|Mirror Moon|Storm Sprite|Seeker Sprite|Nova Mote|Gravity Mote|Phase Drone|Fork Drone|Mercury Switch|Copper Heart|Ceramic Fuse|Blue Capacitor|Gold Capacitor|Fat Capacitor|Long Barrel|Short Barrel|Warped Lens|Dead Channel|Live Channel|Spare Bulkhead|Field Rations|Mag Clamp|Data Leech|Hot Wiring|Coolant Loop|Overpressure|Needle Rounds|Soft Rounds|Salvage Map|Combat Telemetry|Shock Mount|Drive Belt|Ballast|Razor Wire|Bright Powder|Dark Powder|Fast Clock|Slow Clock|Spare Reactor|Dirty Reactor|Clean Reactor|Twin Pump|Wide Nozzle|Pinpoint Nozzle|Hunter Array|Surveyor|Vacuum Scoop|Learning Core|Blood Battery|Revenge Relay|Last Bulkhead|Kill Switch|Scrap Feast|Critical Reboot|Phase Memory|Terminal Velocity|Big Bang Board|Echo Chamber|Fork Tax|Ghost Protocol|Arc Battery|Prism Mirror|Anchor Clock|Homing Instinct|Second Opinion|Orbital Foundry|Mutual Defense|Crowded Orbit|Black Sun|White Noise|Needle Storm|Glass Needle|Heavy Phase|Bright Ghost|Seeking Splitter|Storm Lens|Gravity Prism|Nova Guidance|Phase Anchor|Critical Arc|Razor Payload|Razor Velocity|Ember Arc|Wisp Anchor|Drone Fork|Aegis Nova|Familiar Guidance|Orbital Prism|Saint Elmo|Funeral Star|Choir Engine|Event Horizon Chip|Recursive Bus|Prism Rail|Critical Mass Cell|Guardian Network|Moon Court|Dead God Circuit|Rusted Key|Lucky Bolt|Warm Seat|Red Tape|Blue Tape|Green Tape|Wrecking Node|Tiny Magnet|Training Manual|Polished Casing`.split(
    "|",
  );
if (names.length !== 150)
  throw new Error(`Expected 150 module names, got ${names.length}`);
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const core = {
  "Hot Core": { damage: 1.28, tags: ["damage"] },
  "Redline Coil": { fireRate: 0.84, tags: ["cadence"] },
  "Rail Accelerator": { bulletSpeed: 1.28, tags: ["velocity"] },
  "Dense Slug": { bulletSize: 1.3, damage: 1.12, tags: ["payload"] },
  "Split Bus": { shots: 1, tags: ["fork"] },
  "Trident Relay": { shots: 2, damage: 0.82, tags: ["fork"] },
  "Phase Jacket": { pierce: 1, tags: ["pierce"] },
  "Ghost Bore": { pierce: 2, bulletSize: 0.9, tags: ["pierce"] },
  "Lucky Circuit": { crit: 0.1, tags: ["crit"] },
  "Guidance Kernel": { flags: ["missile"], tags: ["seek"] },
  "Arc Imprint": { flags: ["arc"], tags: ["arc"] },
  "Nova Imprint": { flags: ["nova"], tags: ["nova"] },
  "Gravity Anchor": { flags: ["mines"], tags: ["anchor"] },
  "Prism Imprint": { flags: ["beam"], tags: ["prism"] },
  "Razor Orbit": { companion: "blade", tags: ["orbital"] },
  "Aegis Halo": { companion: "shield", tags: ["orbital", "armor"] },
  "Ember Familiar": { companion: "ember", tags: ["familiar"] },
  "Void Wisp": { companion: "wisp", tags: ["familiar", "nova"] },
  Gundrone: { companion: "drone", tags: ["familiar", "pierce"] },
  "Wrecking Node": { companion: "wrecking", tags: ["familiar", "impact"] },
};
const templates = [
  { damage: 1.14, tags: ["damage"] },
  { fireRate: 0.9, tags: ["cadence"] },
  { bulletSpeed: 1.16, tags: ["velocity"] },
  { bulletSize: 1.16, tags: ["payload"] },
  { maxHp: 18, tags: ["hull"] },
  { heal: 24, tags: ["hull"] },
  { regen: 0.18, tags: ["hull"] },
  { armor: 0.045, tags: ["armor"] },
  { speed: 1.1, tags: ["mobility"] },
  { magnet: 1.3, tags: ["economy"] },
  { xpGain: 1.12, tags: ["economy"] },
  { crit: 0.05, tags: ["crit"] },
  { damage: 1.08, bulletSpeed: 1.1, tags: ["damage", "velocity"] },
  { maxHp: 12, armor: 0.025, tags: ["hull", "armor"] },
  { fireRate: 0.94, speed: 1.06, tags: ["cadence", "mobility"] },
];
const passiveTags = {
  multishot: "fork",
  size: "payload",
  bullet: "velocity",
  missile: "seek",
  mines: "anchor",
  beam: "prism",
  "razor-orbit": "orbital",
  "aegis-orbit": "orbital",
  "ember-familiar": "familiar",
  "wisp-familiar": "familiar",
  "drone-familiar": "familiar",
  "wrecking-familiar": "familiar",
};
const companionPassives = {
  blade: "razor-orbit",
  shield: "aegis-orbit",
  ember: "ember-familiar",
  wisp: "wisp-familiar",
  drone: "drone-familiar",
  wrecking: "wrecking-familiar",
};
const descriptions = {
  damage: "Damage up.",
  cadence: "Fire rate up.",
  velocity: "Projectile speed up.",
  payload: "Projectile mass up.",
  hull: "Hull integrity up.",
  armor: "Damage resistance up.",
  mobility: "Movement speed up.",
  economy: "Salvage acquisition improved.",
  crit: "Critical chance up.",
  fork: "Adds or empowers split volleys.",
  pierce: "Adds or empowers piercing rounds.",
  seek: "Adds guidance behavior.",
  arc: "Adds electrical behavior.",
  nova: "Adds explosive behavior.",
  anchor: "Adds gravity behavior.",
  prism: "Adds prism behavior.",
  orbital: "Adds an orbital system.",
  familiar: "Adds a familiar system.",
  impact: "Movement builds momentum into heavy contact damage.",
};
export const MODULES = names.map((name, i) => {
  const definition = SPECIAL_MODULES[name],
    base = {
      ...(definition?.effect || core[name] || templates[i % templates.length]),
    },
    tags = [
      ...(base.tags || []),
      ...(base.passives || []).map((id) => passiveTags[id] || id),
      ...(base.companions || []).map((id) =>
        id === "blade" || id === "shield" ? "orbital" : "familiar",
      ),
    ].filter((tag, index, all) => all.indexOf(tag) === index);
  delete base.tags;
  const special = definition ? slug(name) : null;
  if (special) base.special = special;
  const rarity = special
    ? i > 129
      ? "SPECIAL"
      : "RARE"
    : i % 11 === 0
      ? "RARE"
      : i % 4 === 0
        ? "UNCOMMON"
        : "COMMON";
  const desc =
    definition?.description ||
    tags
      .map((t) => descriptions[t])
      .filter(Boolean)
      .join(" ") ||
    "Ship systems improved.";
  return { id: slug(name), name, desc, effect: base, tags, rarity };
});
export const moduleById = (id) => MODULES.find((m) => m.id === id);
export function applyModule(p, m) {
  p.items ??= new Set();
  if (p.items.has(m.id)) return false;
  p.items.add(m.id);
  const e = m.effect || {};
  for (const k of [
    "damage",
    "fireRate",
    "bulletSpeed",
    "bulletSize",
    "speed",
    "magnet",
    "xpGain",
  ])
    if (e[k] != null) p[k] *= e[k];
  for (const k of ["shots", "pierce"]) if (e[k]) p[k] += e[k];
  if (e.maxHp) {
    p.maxHp = Math.max(25, p.maxHp + e.maxHp);
    p.hp = Math.min(p.maxHp, p.hp + Math.max(0, e.maxHp));
  }
  if (e.heal) p.hp = Math.min(p.maxHp, p.hp + e.heal);
  if (e.crit) p.crit = Math.min(0.75, p.crit + e.crit);
  if (e.armor) p.armor = Math.max(0, Math.min(0.65, p.armor + e.armor));
  if (e.regen) p.regen = Math.max(0, p.regen + e.regen);
  if (e.flags)
    for (const id of e.flags) {
      p.passives ??= {};
      p.passives[id] = 1;
    }
  if (e.companion) {
    p.companions ??= {};
    p.companions[e.companion] = (p.companions[e.companion] || 0) + 1;
    p.passives ??= {};
    p.passives[companionPassives[e.companion]] = 1;
  }
  if (e.companions) {
    p.companions ??= {};
    p.passives ??= {};
    for (const id of e.companions) {
      p.companions[id] = (p.companions[id] || 0) + 1;
      p.passives[companionPassives[id]] = 1;
    }
  }
  if (e.special) {
    p.specials ??= new Set();
    p.specials.add(e.special);
  }
  p.passives ??= {};
  p.passives[m.id] = 1;
  for (const id of e.passives || []) p.passives[id] = (p.passives[id] || 0) + 1;
  for (const id of e.transforms || []) p.passives[`transform-${id}`] = 1;
  for (const tag of m.tags || []) p.passives[tag] = (p.passives[tag] || 0) + 1;
  return true;
}
const weight = (m) =>
  m.rarity === "COMMON"
    ? 8
    : m.rarity === "UNCOMMON"
      ? 5
      : m.rarity === "RARE"
        ? 2
        : 0.7;
const BLACK_SIGNAL_MODULES = new Set([
  "blood-battery",
  "revenge-relay",
  "last-bulkhead",
  "kill-switch",
  "ghost-protocol",
  "black-sun",
  "white-noise",
  "glass-needle",
  "heavy-phase",
  "funeral-star",
  "dead-god-circuit",
]);
export const MODULE_POOLS = Object.freeze({
  salvage: { name: "SALVAGE TRANSMISSION", color: "#78ebff" },
  boss: { name: "BOSS RELIC", color: "#ffe27b" },
  companion: { name: "FOUNDRY SIGNAL", color: "#c994ff" },
  black: { name: "BLACK SIGNAL", color: "#ff6f9f" },
});
export function modulePoolForLevel(level) {
  if (level > 1 && level % 7 === 0) return "companion";
  if (level > 1 && level % 5 === 0) return "boss";
  return "salvage";
}
export function modulePool(module) {
  if (BLACK_SIGNAL_MODULES.has(module.id)) return "black";
  if (module.tags.some((tag) => tag === "orbital" || tag === "familiar"))
    return "companion";
  if (module.effect.special) return "boss";
  return "salvage";
}
function poolCandidates(pool) {
  if (pool === "black")
    return MODULES.filter((module) => BLACK_SIGNAL_MODULES.has(module.id));
  if (pool === "companion")
    return MODULES.filter((module) =>
      module.tags.some((tag) => tag === "orbital" || tag === "familiar"),
    );
  if (pool === "boss")
    return MODULES.filter(
      (module) => module.effect.special || module.rarity === "RARE",
    );
  return MODULES.filter((module) => module.rarity !== "SPECIAL");
}
export function randomModules(
  player,
  n = 3,
  pool = "salvage",
  random = Math.random,
) {
  const owned = player.items || new Set();
  let candidates = poolCandidates(pool).filter(
    (module) => !owned.has(module.id),
  );
  if (candidates.length < n)
    candidates = MODULES.filter((module) => !owned.has(module.id));
  return candidates
    .map((m) => ({ m, k: random() ** (1 / weight(m)) }))
    .sort((a, b) => b.k - a.k)
    .slice(0, n)
    .map((x) => x.m);
}

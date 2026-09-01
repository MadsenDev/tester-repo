import { applyCore } from "./core.js";

const visual = (color, accent, points, details, engines, canopy = [0, -0.12]) => ({
  color,
  accent,
  points,
  details,
  engines,
  canopy,
});

export const SHIPS = [
  {
    id: "strider",
    name: "STRIDER",
    role: "BALANCED INTERCEPTOR",
    unlock: "Always available",
    unlocked: () => true,
    desc: "Balanced interceptor. Reliable in every sector.",
    stats: ["HULL 100", "SPEED 245", "DAMAGE 18"],
    visual: visual(
      "#78ebff",
      "#e9fdff",
      [[0,-1.25],[.76,.82],[.25,.62],[0,.98],[-.25,.62],[-.76,.82]],
      [[[-.5,.62],[0,-.72],[.5,.62]]],
      [[-.3,.68],[.3,.68]],
    ),
    apply: () => {},
  },
  {
    id: "bulwark",
    name: "BULWARK",
    role: "ARMORED JUGGERNAUT",
    unlock: "Win 1 run",
    unlocked: (stats) => stats.wins >= 1,
    desc: "Heavy hull: +45 HP, +18% armor, -14% speed.",
    stats: ["HULL 145", "ARMOR 18%", "SPEED 211"],
    visual: visual(
      "#8fffc3",
      "#eafff3",
      [[0,-1.05],[.62,-.55],[.92,.7],[.42,.92],[0,.68],[-.42,.92],[-.92,.7],[-.62,-.55]],
      [[[-.63,-.4],[-.35,.52],[0,.3],[.35,.52],[.63,-.4]],[[-.75,.58],[.75,.58]]],
      [[-.55,.7],[0,.62],[.55,.7]],
    ),
    apply: (p) => {
      p.maxHp += 45;
      p.hp += 45;
      p.armor += 0.18;
      p.speed *= 0.86;
      p.r = 13;
    },
  },
  {
    id: "volt",
    name: "VOLT",
    role: "GLASS-CANNON NEEDLE",
    unlock: "Reach 2,500 kills",
    unlocked: (stats) => stats.kills >= 2500,
    desc: "Glass cannon: +22% fire rate, +20% damage, -25 max HP.",
    stats: ["HULL 75", "DAMAGE 22", "FIRE 0.33s"],
    visual: visual(
      "#ffe47a",
      "#fffbe3",
      [[0,-1.58],[.43,.82],[.12,.58],[0,1.05],[-.12,.58],[-.43,.82]],
      [[[0,-1.12],[0,.62]],[[-.26,.48],[0,.15],[.26,.48]]],
      [[0,.82]],
      [0,-.22],
    ),
    apply: (p) => {
      p.maxHp -= 25;
      p.hp = Math.min(p.hp, p.maxHp);
      p.fireRate *= 0.78;
      p.damage *= 1.2;
      p.r = 9.5;
    },
  },
  {
    id: "harvester",
    name: "HARVESTER",
    role: "SALVAGE ENGINE",
    unlock: "Win 3 runs",
    unlocked: (stats) => stats.wins >= 3,
    desc: "Collector: +70% pickup range and +18% XP, but slower fire.",
    stats: ["PICKUP 187", "XP +18%", "FIRE 0.47s"],
    visual: visual(
      "#c994ff",
      "#f5eaff",
      [[0,-1.05],[.58,-.7],[.95,0],[.64,.78],[0,.62],[-.64,.78],[-.95,0],[-.58,-.7]],
      [[[-.7,-.05],[-.32,.35],[0,-.42],[.32,.35],[.7,-.05]],[[-.45,-.58],[.45,-.58]]],
      [[-.48,.62],[.48,.62]],
    ),
    apply: (p) => {
      p.magnet *= 1.7;
      p.xpGain *= 1.18;
      p.fireRate *= 1.12;
      p.r = 12;
    },
  },
  {
    id: "wraith",
    name: "WRAITH",
    role: "PHASE SKIRMISHER",
    unlock: "Complete 5 runs",
    unlocked: (stats) => stats.runs >= 5,
    desc: "Tiny and elusive: +20% speed, +8% crit, -20 max HP.",
    stats: ["HULL 80", "SPEED 294", "HITBOX 8"],
    visual: visual(
      "#aebcff",
      "#f0f2ff",
      [[0,-1.18],[.25,-.45],[.92,.35],[.52,.92],[.1,.48],[0,.92],[-.1,.48],[-.52,.92],[-.92,.35],[-.25,-.45]],
      [[[-.72,.32],[0,-.55],[.72,.32]],[[-.38,.6],[0,.22],[.38,.6]]],
      [[-.5,.62],[.5,.62]],
      [0,-.28],
    ),
    apply: (p) => {
      p.maxHp -= 20;
      p.hp = Math.min(p.hp, p.maxHp);
      p.speed *= 1.2;
      p.crit += 0.08;
      p.dashBoost += 0.25;
      p.r = 8;
    },
  },
  {
    id: "lancer",
    name: "LANCER",
    role: "KINETIC RAILFRAME",
    unlock: "Reach 5,000 kills",
    unlocked: (stats) => stats.kills >= 5000,
    desc: "Railframe: +30% damage, +45% velocity and +1 pierce; fires slower.",
    stats: ["DAMAGE 23", "PIERCE 1", "VELOCITY 754"],
    visual: visual(
      "#ff957d",
      "#fff0eb",
      [[0,-1.62],[.22,-.2],[.75,.78],[.25,.58],[0,1.04],[-.25,.58],[-.75,.78],[-.22,-.2]],
      [[[0,-1.2],[0,.7]],[[-.55,.58],[0,.12],[.55,.58]]],
      [[-.28,.66],[.28,.66]],
      [0,-.1],
    ),
    apply: (p) => {
      p.damage *= 1.3;
      p.bulletSpeed *= 1.45;
      p.pierce += 1;
      p.fireRate *= 1.22;
      p.speed *= 0.95;
      p.r = 10;
    },
  },
  {
    id: "relay",
    name: "RELAY",
    role: "TWIN-SIGNAL GUNSHIP",
    unlock: "Win 5 runs",
    unlocked: (stats) => stats.wins >= 5,
    desc: "Twin emitters: starts with two shots and faster fire, but weaker rounds.",
    stats: ["VOLLEY 2", "DAMAGE 13", "FIRE 0.39s"],
    visual: visual(
      "#ff8ecb",
      "#fff0f8",
      [[-.48,-1.1],[0,-.55],[.48,-1.1],[.82,.78],[.28,.52],[0,.98],[-.28,.52],[-.82,.78]],
      [[[-.46,-.72],[-.3,.48],[0,.18],[.3,.48],[.46,-.72]],[[-.65,.58],[.65,.58]]],
      [[-.48,.66],[.48,.66]],
      [0,.05],
    ),
    apply: (p) => {
      p.shots += 1;
      p.damage *= 0.74;
      p.fireRate *= 0.92;
      p.bulletSize *= 0.88;
      p.r = 11.5;
    },
  },
  {
    id: "halo",
    name: "HALO",
    role: "ORBITAL CARRIER",
    unlock: "Win 8 runs",
    unlocked: (stats) => stats.wins >= 8,
    desc: "Carrier: +20 HP, +10% armor and two orbitals; -10% speed and fire rate.",
    stats: ["HULL 120", "ORBITALS 2", "ARMOR 10%"],
    visual: visual(
      "#79ffd2",
      "#effff9",
      [[0,-1.08],[.62,-.62],[.95,0],[.62,.62],[0,1.08],[-.62,.62],[-.95,0],[-.62,-.62]],
      [[[-.65,-.45],[0,-.72],[.65,-.45]],[[.65,.45],[0,.72],[-.65,.45]]],
      [[-.42,.58],[.42,.58]],
      [0,0],
    ),
    apply: (p) => {
      p.maxHp += 20;
      p.hp += 20;
      p.armor += 0.1;
      p.orbitals += 2;
      p.speed *= 0.9;
      p.fireRate *= 1.1;
      p.r = 12.5;
    },
  },
];

export function unlockedShips(stats) {
  return SHIPS.filter((ship) => ship.unlocked(stats));
}

export function shipById(id) {
  return SHIPS.find((ship) => ship.id === id) || SHIPS[0];
}

export function applyShip(player, id) {
  const ship = shipById(id);
  player.shipId = ship.id;
  player.shipName = ship.name;
  player.shipRole = ship.role;
  player.shipColor = ship.visual.color;
  player.shipAccent = ship.visual.accent;
  player.shipVisual = ship.visual;
  player.facing ??= -Math.PI / 2;
  applyCore(player);
  ship.apply(player);
  return player;
}

export function updateShipHeading(player, dx, dy, dt) {
  if (Math.hypot(dx, dy) < 0.08) return player.facing;
  const target = Math.atan2(dy, dx),
    current = player.facing ?? target,
    delta = Math.atan2(Math.sin(target - current), Math.cos(target - current)),
    blend = 1 - Math.exp(-12 * Math.max(0, dt));
  player.facing = current + delta * blend;
  return player.facing;
}

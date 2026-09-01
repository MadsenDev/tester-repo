import assert from "node:assert/strict";
import test from "node:test";
import { updateCompanions } from "../src/companions.js";
import { applyModule, MODULES, moduleById } from "../src/module-catalog.js";
import {
  echoSpecialVolley,
  onSpecialKill,
  onSpecialLevelUp,
  resolveSpecialDamage,
  SPECIAL_MODULES,
  specialChoiceCount,
  specialDamageMultiplier,
  updateSpecialModules,
} from "../src/special-modules.js";
import { blasterTraits, decorateBlaster } from "../src/synergies.js";

const player = () => ({
  x: 0,
  y: 0,
  hp: 100,
  maxHp: 100,
  damage: 20,
  fireRate: 0.42,
  bulletSpeed: 520,
  bulletSize: 4,
  speed: 245,
  magnet: 110,
  xpGain: 1,
  armor: 0,
  crit: 0,
  regen: 0,
  shots: 1,
  pierce: 0,
  overdrive: 0,
  invuln: 0,
  items: new Set(),
  specials: new Set(),
  passives: {},
  weapons: {},
  companions: { blade: 0, shield: 0, ember: 0, wisp: 0, drone: 0 },
  weaponFx: [],
});

const install = (ship, id) => {
  const module = moduleById(id);
  assert.ok(module, `missing module ${id}`);
  assert.equal(applyModule(ship, module), true);
};

test("all 60 special modules have authored descriptions and effects", () => {
  assert.equal(Object.keys(SPECIAL_MODULES).length, 60);
  const catalog = MODULES.filter((module) => module.effect.special);
  assert.equal(catalog.length, 60);
  for (const module of catalog) {
    assert.equal(module.desc, SPECIAL_MODULES[module.name].description);
    assert.doesNotMatch(module.desc, /Rule-changing module:/);
  }
});

test("apex modules activate their named transformations", () => {
  const cases = [
    ["storm-lens", "seekingStorm"],
    ["event-horizon-chip", "eventHorizon"],
    ["recursive-bus", "recursiveViolence"],
    ["prism-rail", "railPrism"],
    ["critical-mass-cell", "criticalMass"],
    ["choir-engine", "thunderChoir"],
    ["orbital-prism", "prismaticRazor"],
    ["guardian-network", "guardianSwarm"],
    ["moon-court", "singularityCourt"],
  ];
  for (const [id, trait] of cases) {
    const ship = player();
    install(ship, id);
    assert.equal(
      blasterTraits(ship)[trait],
      true,
      `${id} should enable ${trait}`,
    );
  }
  const ship = player();
  install(ship, "dead-god-circuit");
  for (const [, trait] of cases) assert.equal(blasterTraits(ship)[trait], true);
});

test("survival specials alter damage, choices, kills and level-ups", () => {
  const ship = player();
  install(ship, "last-bulkhead");
  install(ship, "ghost-protocol");
  install(ship, "second-opinion");
  assert.equal(specialChoiceCount(ship), 4);
  assert.equal(resolveSpecialDamage(ship, 200, () => 0.5).damage, ship.hp - 1);
  ship.hp = 20;
  assert.equal(resolveSpecialDamage(ship, 5, () => 0).evaded, true);

  const battery = player();
  install(battery, "blood-battery");
  battery.hp = 50;
  onSpecialKill(battery, { elite: true, boss: false });
  assert.equal(battery.hp, 51.5);

  const reboot = player(),
    hostileFire = [
      { x: 20, y: 0 },
      { x: 400, y: 0 },
    ];
  install(reboot, "critical-reboot");
  reboot.hp = 50;
  onSpecialLevelUp(reboot, hostileFire);
  assert.equal(reboot.hp, 62);
  assert.equal(hostileFire.length, 1);
});

test("damage and projectile specials change live volleys", () => {
  const ship = player();
  install(ship, "terminal-velocity");
  install(ship, "fork-tax");
  ship.shots = 4;
  assert.ok(specialDamageMultiplier(ship) > 1.25);

  install(ship, "echo-chamber");
  const bullets = [];
  for (let volley = 0; volley < 6; volley++) {
    const start = bullets.length;
    bullets.push({ vx: 100, vy: 0, damage: 10, hit: new Set() });
    echoSpecialVolley(ship, bullets, start);
  }
  assert.equal(bullets.length, 7);
  assert.equal(bullets.at(-1).damage, 6);

  install(ship, "homing-instinct");
  install(ship, "arc-battery");
  const bullet = decorateBlaster(
    { vx: 100, vy: 0, damage: 10, r: 2, pierce: 0 },
    ship,
  );
  assert.ok(bullet.turn >= 7.56);
  assert.equal(bullet.arcBattery, true);
});

test("auras, projectile purges and companion forks execute", () => {
  const ship = player(),
    enemies = [{ x: 20, y: 0, r: 5, hp: 100, targetable: true }],
    enemyBullets = [
      { x: 20, y: 0 },
      { x: 400, y: 0 },
    ],
    particles = [];
  install(ship, "black-sun");
  install(ship, "white-noise");
  updateSpecialModules(ship, 4.1, {
    enemies,
    enemyBullets,
    particles,
    time: 1,
  });
  assert.ok(enemies[0].hp < 100);
  assert.equal(enemyBullets.length, 1);

  const droneShip = player(),
    shots = [];
  install(droneShip, "drone-fork");
  updateCompanions(
    droneShip,
    1,
    [{ x: 100, y: 0, r: 5, hp: 100, targetable: true }],
    shots,
    1,
  );
  assert.equal(
    shots.filter((shot) => shot.kind === "familiar-drone").length,
    3,
  );
});

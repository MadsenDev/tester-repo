import test from "node:test";
import assert from "node:assert/strict";
import {
  SHIPS,
  applyShip,
  shipById,
  unlockedShips,
  updateShipHeading,
} from "../src/ships.js";
import { playerShieldVisual, shipSvgMarkup } from "../src/ship-render.js";

globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
};

const freshPlayer = () => ({
  r: 11,
  hp: 100,
  maxHp: 100,
  speed: 245,
  fireRate: 0.42,
  damage: 18,
  shots: 1,
  pierce: 0,
  bulletSpeed: 520,
  bulletSize: 4,
  magnet: 110,
  xpGain: 1,
  crit: 0.05,
  armor: 0,
  dashBoost: 0,
  orbitals: 0,
});
const near = (actual, expected, tolerance = 0.001) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test("the hangar contains eight mechanically and visually distinct chassis", () => {
  assert.equal(SHIPS.length, 8);
  assert.equal(new Set(SHIPS.map((ship) => ship.id)).size, 8);
  assert.equal(new Set(SHIPS.map((ship) => ship.visual.color)).size, 8);
  assert.equal(
    new Set(SHIPS.map((ship) => JSON.stringify(ship.visual.points))).size,
    8,
  );
  for (const ship of SHIPS) {
    assert.equal(ship.stats.length, 3);
    assert.match(shipSvgMarkup(ship), new RegExp(ship.name));
  }
});

test("ship unlocks follow their documented run milestones", () => {
  assert.deepEqual(
    unlockedShips({ runs: 0, wins: 0, kills: 0 }).map((ship) => ship.id),
    ["strider"],
  );
  const unlocked = unlockedShips({ runs: 5, wins: 5, kills: 5000 }).map(
    (ship) => ship.id,
  );
  assert.deepEqual(unlocked, [
    "strider",
    "bulwark",
    "volt",
    "harvester",
    "wraith",
    "lancer",
    "relay",
  ]);
  assert.equal(
    unlockedShips({ runs: 8, wins: 8, kills: 5000 }).at(-1).id,
    "halo",
  );
});

test("Wraith and Lancer apply their advertised specialist profiles", () => {
  const wraith = applyShip(freshPlayer(), "wraith");
  assert.equal(wraith.maxHp, 80);
  assert.equal(wraith.r, 8);
  near(wraith.speed, 294);
  near(wraith.crit, 0.13);

  const lancer = applyShip(freshPlayer(), "lancer");
  near(lancer.damage, 23.4);
  near(lancer.bulletSpeed, 754);
  assert.equal(lancer.pierce, 1);
  near(lancer.fireRate, 0.5124);
});

test("Relay and Halo begin with visible build-defining equipment", () => {
  const relay = applyShip(freshPlayer(), "relay");
  assert.equal(relay.shots, 2);
  near(relay.damage, 13.32);
  near(relay.fireRate, 0.3864);

  const halo = applyShip(freshPlayer(), "halo");
  assert.equal(halo.maxHp, 120);
  assert.equal(halo.hp, 120);
  assert.equal(halo.orbitals, 2);
  near(halo.armor, 0.1);
});

test("the active chassis turns toward movement and holds its last heading", () => {
  const player = { facing: -Math.PI / 2 };
  const first = updateShipHeading(player, 1, 0, 1 / 60);
  assert.ok(first > -Math.PI / 2 && first < 0);
  for (let i = 0; i < 60; i++) updateShipHeading(player, 1, 0, 1 / 60);
  near(player.facing, 0, 0.001);
  const held = updateShipHeading(player, 0, 0, 1);
  near(held, player.facing);
});

test("each hull rotates around an authored center-of-mass pivot", () => {
  for (const ship of SHIPS) {
    const [x, y] = ship.visual.pivot;
    assert.ok(Math.abs(x) <= 0.1);
    assert.ok(y >= 0 && y <= 0.3);
  }
  assert.ok(
    shipById("lancer").visual.pivot[1] >
      shipById("strider").visual.pivot[1],
  );
  assert.ok(
    shipById("strider").visual.pivot[1] >
      shipById("bulwark").visual.pivot[1],
  );
  assert.match(shipSvgMarkup("lancer"), /fill="#05070e"/);
});

test("heading interpolation takes the shortest turn across the angle seam", () => {
  const player = { facing: 3.1 };
  updateShipHeading(player, Math.cos(-3.1), Math.sin(-3.1), 1 / 60);
  assert.ok(player.facing > 3.1);
  assert.equal(shipById("missing").id, "strider");
});

test("the original spinning hexagon remains as a responsive combat shield", () => {
  const resting = playerShieldVisual({ r: 11, armor: 0, invuln: 0 }, 2);
  const armored = playerShieldVisual({ r: 11, armor: 0.5, invuln: 0 }, 2);
  const hit = playerShieldVisual({ r: 11, armor: 0.5, invuln: 0.22 }, 2);
  assert.equal(resting.sides, 6);
  assert.equal(resting.radius, 18);
  assert.equal(resting.rotation, -3);
  assert.ok(armored.alpha > resting.alpha);
  assert.ok(hit.radius > armored.radius);
  assert.ok(hit.lineWidth > armored.lineWidth);
});

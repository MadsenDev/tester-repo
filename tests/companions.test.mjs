import assert from "node:assert/strict";
import test from "node:test";
import {
  interceptAegisProjectiles,
  stepWreckingNode,
} from "../src/companion-physics.js";
import { initCompanions, updateCompanions } from "../src/companions.js";

const player = () => ({
  x: 0,
  y: 0,
  r: 11,
  damage: 20,
  bulletSpeed: 520,
  bulletSize: 4,
  passives: {},
  specials: new Set(),
  weaponFx: [],
});

test("the Wrecking Node converts real momentum into contact damage", () => {
  const p = player(),
    state = {
      x: 36,
      y: 0,
      vx: 340,
      vy: 0,
      scrap: 0,
      hits: new Map(),
    },
    enemy = { x: 41, y: 0, r: 10, hp: 100, targetable: true };
  stepWreckingNode(p, state, 1, 0.016, [enemy], [], 1);
  assert.ok(enemy.hp < 100);
  assert.ok(state.speed > 115);
});

test("fast Wrecking Node swings can erase hostile projectiles", () => {
  const p = player(),
    state = {
      x: 36,
      y: 0,
      vx: 360,
      vy: 0,
      scrap: 0,
      hits: new Map(),
    },
    hostile = { x: 42, y: 0, r: 4, life: 2 };
  stepWreckingNode(p, state, 2, 0.016, [], [hostile], 1);
  assert.equal(hostile.life, 0);
});

test("Aegis faces incoming fire and spends a rechargeable interception", () => {
  const p = player(),
    state = { shieldAngle: 0, shieldCharges: 1 },
    hostile = { x: 47, y: 0, r: 4, life: 2 };
  const hits = interceptAegisProjectiles(p, state, 1, 0.016, [], [hostile]);
  assert.equal(hostile.life, 0);
  assert.equal(hits.length, 1);
  assert.equal(state.shieldCharges, 0);
});

test("Razor orbitals leave their idle orbit to strike distant targets", () => {
  const p = player();
  p.companions = { blade: 1, shield: 0, ember: 0, wisp: 0, drone: 0, wrecking: 0 };
  initCompanions(p);
  const enemy = { x: 180, y: 0, r: 12, hp: 160, targetable: true };
  for (let i = 0; i < 8; i++) {
    updateCompanions(p, 0.1, [enemy], [], [], i * 0.1);
  }
  assert.ok(enemy.hp < 160);
});

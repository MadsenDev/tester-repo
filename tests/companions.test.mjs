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

const simulateNode = (p, state, level, enemies, seconds = 2.5) => {
  const dt = 1 / 60;
  for (let i = 0; i < seconds / dt; i++)
    stepWreckingNode(p, state, level, dt, enemies, [], i * dt);
};

test("the Wrecking Node autonomously slings into distant targets", () => {
  const p = player(),
    state = {},
    enemy = { x: 240, y: 0, r: 10, hp: 200, targetable: true };
  simulateNode(p, state, 1, [enemy], 1.4);
  assert.ok(enemy.hp < 200);
  assert.ok(state.impacts >= 1);
  assert.ok(p.weaponFx.some((effect) => effect.kind === "nova"));
});

test("player-built charge makes the next Wrecking Node impact stronger", () => {
  const firstImpact = (charge) => {
    const p = player(),
      state = { charge, cooldown: 0 },
      enemy = { x: 240, y: 0, r: 10, hp: 500, targetable: true };
    for (let i = 0; i < 100 && (state.impacts || 0) === 0; i++)
      stepWreckingNode(p, state, 1, 1 / 60, [enemy], [], i / 60);
    return 500 - enemy.hp;
  };
  assert.ok(firstImpact(1) > firstImpact(0) * 1.35);
});

test("direct momentum still turns the resting Node into a contact weapon", () => {
  const p = player(),
    state = {
      x: 36,
      y: 0,
      vx: 340,
      vy: 0,
      hits: new Map(),
    },
    enemy = { x: 41, y: 0, r: 10, hp: 100, targetable: true };
  stepWreckingNode(p, state, 1, 0.016, [enemy], [], 1);
  assert.ok(enemy.hp < 100);
  assert.ok(state.speed > 115);
});

test("the level-one tether cuts enemies caught between ship and Node", () => {
  const p = player(),
    state = {
      x: 100,
      y: 0,
      vx: 0,
      vy: 0,
      mode: "idle",
      cooldown: 99,
      hits: new Map(),
    },
    enemy = { x: 50, y: 0, r: 8, hp: 100, targetable: true };
  stepWreckingNode(p, state, 1, 0.016, [enemy], [], 1);
  assert.ok(enemy.hp < 100);
});

test("the base Wrecking Node ricochets into a second target", () => {
  const p = player(),
    state = {},
    enemies = [
      { x: 180, y: 0, r: 12, hp: 300, targetable: true },
      { x: 280, y: 50, r: 12, hp: 300, targetable: true },
    ];
  simulateNode(p, state, 1, enemies, 1.5);
  assert.ok(enemies[0].hp < 300);
  assert.ok(enemies[1].hp < 300);
});

test("successful Wrecking Node impacts grow its body without requiring kills", () => {
  const p = player(),
    state = { impacts: 5, cooldown: 99 },
    enemy = { x: 300, y: 0, r: 10, hp: 500, targetable: true };
  stepWreckingNode(p, state, 1, 0.016, [enemy], [], 1);
  assert.equal(state.growth, 1);
  assert.ok(state.radius > 12);
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

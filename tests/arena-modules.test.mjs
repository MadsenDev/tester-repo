import assert from "node:assert/strict";
import test from "node:test";
import {
  captureAegisProjectile,
  onArenaEnemyKilled,
  updateArenaModules,
} from "../src/arena-modules.js";

const player = (...specials) => ({
  x: 100,
  y: 100,
  r: 11,
  damage: 20,
  specials: new Set(specials),
  passives: {},
  companions: {},
  companionState: {},
  weaponFx: [],
});

const enemy = (x, y, extra = {}) => ({
  x,
  y,
  r: 10,
  hp: 200,
  hpMax: 200,
  targetable: true,
  ...extra,
});

const context = (enemies = [], bullets = []) => ({
  enemies,
  bullets,
  enemyBullets: [],
  time: 1,
  W: 400,
  H: 300,
});

const round = (x, y, extra = {}) => ({
  kind: "blaster",
  x,
  y,
  vx: 100,
  vy: 0,
  r: 4,
  life: 1,
  pierce: 0,
  damage: 20,
  ...extra,
});

test("Constellation Engine seeds stars and connects damaging triangles", () => {
  const p = player("constellation-engine"),
    target = enemy(50, 0),
    world = context([target], []);
  for (const [x, y] of [[0, 0], [100, 0], [50, 100]]) {
    world.bullets.push(round(x, y, { life: 0.02 }));
    updateArenaModules(p, 0.13, world);
  }
  assert.equal(p.arenaRuntime.stars.length, 3);
  assert.ok(target.hp < 200);
});

test("Reversal Chamber returns rounds with more damage and piercing", () => {
  const p = player("reversal-chamber"),
    bullet = round(100, 100),
    world = context([], [bullet]);
  updateArenaModules(p, 0.63, world);
  assert.equal(bullet.reversed, true);
  assert.equal(bullet.vx, -100);
  assert.ok(bullet.damage > 20);
  assert.ok(bullet.pierce >= 1);
});

test("Aegis Reservoir converts six captures into a retaliatory fan", () => {
  const p = player("aegis-reservoir"),
    world = context([enemy(280, 100)], []);
  for (let index = 0; index < 6; index++)
    captureAegisProjectile(p, { damage: 12 });
  updateArenaModules(p, 0.016, world);
  assert.equal(p.arenaRuntime.reservoir.length, 0);
  assert.equal(world.bullets.filter((bullet) => bullet.kind === "reservoir-round").length, 6);
});

test("Orbit Loom turns companion positions into damaging edges", () => {
  const p = player("orbit-loom"),
    target = enemy(50, 0),
    world = context([target], []);
  p.x = p.y = 0;
  p.companions = { blade: 2 };
  p.companionState = { blades: [{ x: 0, y: 0 }, { x: 100, y: 0 }] };
  updateArenaModules(p, 0.2, world);
  assert.ok(target.hp < 200);
});

test("Broadside Protocol fires three arena-wide lanes after warning", () => {
  const p = player("broadside-protocol"),
    target = enemy(240, 100),
    world = context([target], []);
  p.arenaRuntime = {
    stars: [],
    echoes: [],
    reservoir: [],
    pendingBursts: [],
    broadsideCooldown: 0,
  };
  updateArenaModules(p, 0.6, world);
  assert.equal(p.arenaRuntime.broadside.fired, true);
  assert.ok(target.hp < 200);
});

test("Grave Echo creates temporary allies that fire at enemies", () => {
  const p = player("grave-echo"),
    world = context([enemy(260, 100)], []);
  onArenaEnemyKilled(p, enemy(120, 100, { elite: true, color: "#f0f" }));
  updateArenaModules(p, 0.25, world);
  assert.equal(p.arenaRuntime.echoes.length, 1);
  assert.ok(world.bullets.some((bullet) => bullet.kind === "echo-round"));
});

test("Split Horizon wraps a friendly round through the opposite edge", () => {
  const p = player("split-horizon"),
    bullet = round(450, 100),
    world = context([], [bullet]);
  updateArenaModules(p, 0.016, world);
  assert.equal(bullet.wrapped, true);
  assert.equal(bullet.x, -42);
  assert.ok(bullet.damage > 20);
});

test("Split Horizon wraps before Reversal Chamber returns a combined round", () => {
  const p = player("split-horizon", "reversal-chamber"),
    bullet = round(450, 100, { arenaAge: 0.7 }),
    world = context([], [bullet]);
  updateArenaModules(p, 0.016, world);
  assert.equal(bullet.wrapped, true);
  assert.equal(bullet.reversed, undefined);
  updateArenaModules(p, 0.016, world);
  assert.equal(bullet.reversed, true);
  assert.ok(bullet.vx < 0);
});

test("Devouring Moon compresses absorbed rounds into one lance", () => {
  const p = player("devouring-moon"),
    target = enemy(300, 100),
    source = round(168, 100, { damage: 120 }),
    world = context([target], [source]);
  updateArenaModules(p, 0.016, world);
  assert.equal(source.life, 0);
  assert.ok(world.bullets.some((bullet) => bullet.kind === "moon-lance"));
});

test("Pulse Heart captures a volley and releases it as a spiral", () => {
  const p = player("pulse-heart"),
    world = context([], [round(120, 100), round(125, 105)]);
  p.arenaRuntime = {
    stars: [],
    echoes: [],
    reservoir: [],
    pendingBursts: [],
    heartCooldown: 0,
  };
  updateArenaModules(p, 0.016, world);
  assert.equal(p.arenaRuntime.heart.shots.length, 2);
  updateArenaModules(p, 0.72, world);
  assert.equal(p.arenaRuntime.heart, null);
  assert.equal(world.bullets.filter((bullet) => bullet.kind === "heart-round").length, 2);
});

test("Execution Mark detonates and transfers when its target dies", () => {
  const p = player("execution-mark"),
    marked = enemy(150, 100),
    next = enemy(205, 100),
    world = context([marked, next], []);
  updateArenaModules(p, 0.016, world);
  assert.equal(p.arenaRuntime.mark, marked);
  marked.hp = 0;
  onArenaEnemyKilled(p, marked);
  world.enemies = [next];
  updateArenaModules(p, 0.016, world);
  assert.ok(next.hp < 200);
  assert.equal(p.arenaRuntime.mark, next);
  assert.equal(next.arenaMarked, true);
});

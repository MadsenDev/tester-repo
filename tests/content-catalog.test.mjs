import assert from "node:assert/strict";
import test from "node:test";
import { BOSSES, spawnBoss, updateBoss } from "../src/bosses.js";
import { ARCHETYPES } from "../src/entities.js";
import { moveEnemy } from "../src/enemy-ai.js";
import { EVENTS, eventModifiers } from "../src/events.js";
import {
  createRouteState,
  routeChoices,
  SECTOR_ROUTES,
} from "../src/sector-routes.js";

test("the campaign back half has unique boss encounters", () => {
  assert.equal(BOSSES.length, 10);
  assert.equal(new Set(BOSSES.map((boss) => boss.kind)).size, BOSSES.length);
  assert.equal(spawnBoss(1000, 800, 480).kind, "mirror");
  assert.equal(spawnBoss(1000, 800, 540).kind, "lastlight");
});

test("new bosses execute their attack loops", () => {
  for (const minute of [480, 540, 600]) {
    const boss = spawnBoss(1000, 800, minute),
      enemyBullets = [],
      particles = [];
    boss.x = 500;
    boss.y = 220;
    boss.shootCd = 0;
    boss.blastCd = 0;
    boss.railCd = 0;
    updateBoss(boss, 0.1, {
      player: { x: 500, y: 520 },
      enemyBullets,
      particles,
      time: minute,
      onShake() {},
    });
    assert.ok(Number.isFinite(boss.x) && Number.isFinite(boss.y));
    assert.ok(
      enemyBullets.length > 0 ||
        boss.blastZones.length > 0 ||
        boss.sideWarnings.length > 0,
    );
  }
});

test("late sectors unlock three distinct enemy behaviors", () => {
  const late = ARCHETYPES.filter((enemy) => enemy.unlock >= 450);
  assert.deepEqual(
    late.map((enemy) => enemy.kind),
    ["leech", "sentinel", "phaser"],
  );
  assert.equal(new Set(late.map((enemy) => enemy.behavior)).size, 3);
});

test("late enemy behaviors move and produce their intended attacks", () => {
  const late = ARCHETYPES.filter((enemy) => enemy.unlock >= 450),
    enemyBullets = [],
    particles = [],
    player = { x: 500, y: 400 };
  for (const archetype of late) {
    const enemy = {
      ...archetype,
      x: 240,
      y: 220,
      phase: 0,
      shootCd: 0,
      chargeCd: 0,
      elite: false,
      boss: false,
    };
    moveEnemy(enemy, 0.1, {
      player,
      enemyBullets,
      particles,
      time: 550,
    });
    assert.ok(Number.isFinite(enemy.x) && Number.isFinite(enemy.y));
  }
  assert.ok(enemyBullets.length >= 7);
  assert.ok(particles.length >= 18);
});

test("the event pool contains six mechanically distinct events", () => {
  assert.equal(EVENTS.length, 6);
  const swarm = eventModifiers({ current: { id: "swarm-tide" } });
  const glass = eventModifiers({ current: { id: "glass-space" } });
  const echo = eventModifiers({ current: { id: "temporal-echo" } });
  assert.equal(swarm.spawn, 1.65);
  assert.equal(swarm.xp, 1.55);
  assert.equal(glass.damageTaken, 1.75);
  assert.ok(echo.fire < 1 && echo.enemySpeed < 1);
});

test("route content now supports four non-repeating campaign choices per lane", () => {
  assert.equal(SECTOR_ROUTES.length, 12);
  const safe = SECTOR_ROUTES.filter((route) =>
    ["SAFE", "BALANCED"].includes(route.risk),
  );
  const dangerous = SECTOR_ROUTES.filter((route) => route.risk === "DANGEROUS");
  const volatile = SECTOR_ROUTES.filter((route) => route.risk === "VOLATILE");
  assert.equal(safe.length, 4);
  assert.equal(dangerous.length, 4);
  assert.equal(volatile.length, 4);
  const state = createRouteState(),
    offers = [];
  for (let leg = 1; leg <= 4; leg++) offers.push(routeChoices(state, () => 0));
  for (const lane of [0, 1, 2])
    assert.equal(new Set(offers.map((offer) => offer[lane].id)).size, 4);
});

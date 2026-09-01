import assert from "node:assert/strict";
import test from "node:test";
import {
  createBossRuntime,
  recentPlayerDps,
  recordPlayerDamage,
  spawnDirectedBoss,
} from "../src/boss-runtime.js";

const player = {
  damage: 18,
  shots: 1,
  fireRate: 0.42,
  crit: 0.05,
  maxHp: 100,
  items: new Set(),
  weapons: {},
  companions: {},
};

test("rolling damage telemetry forgets stale damage", () => {
  const runtime = createBossRuntime();
  recordPlayerDamage(runtime, 100, 1);
  recordPlayerDamage(runtime, 80, 8);
  assert.ok(recentPlayerDps(runtime, 8) > 20);
  assert.equal(recentPlayerDps(runtime, 20), 0);
});

test("directed spawning uses controlled selection instead of minute roster order", () => {
  const runtime = createBossRuntime(),
    first = spawnDirectedBoss(runtime, {
      w: 1000,
      h: 800,
      time: 300,
      mode: "campaign",
      bossCount: 5,
      player,
      random: () => 0,
    }),
    second = spawnDirectedBoss(runtime, {
      w: 1000,
      h: 800,
      time: 360,
      mode: "campaign",
      bossCount: 6,
      player,
      random: () => 0,
    });
  assert.notEqual(first.kind, second.kind);
  assert.equal(first.kind, first.directorKind);
  assert.equal(second.directorSequence, 2);
});

test("all real modes can spawn through the same adaptive runtime", () => {
  for (const mode of ["campaign", "endless", "bossrush", "expedition"]) {
    const runtime = createBossRuntime();
    recordPlayerDamage(runtime, 900, 295);
    const boss = spawnDirectedBoss(runtime, {
      w: 1000,
      h: 800,
      time: 300,
      sector: 3,
      bossCount: 4,
      mode,
      player,
      random: () => 0.5,
    });
    assert.ok(boss.bossAdaptive);
    assert.ok(boss.hpMax > 0);
    assert.equal(runtime.totalBosses, 1);
  }
});

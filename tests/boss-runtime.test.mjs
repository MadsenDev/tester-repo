import assert from "node:assert/strict";
import test from "node:test";
import {
  captureEnemyHealth,
  createBossRuntime,
  recentPlayerDps,
  recordBossDefeat,
  recordEnemyHealthDelta,
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

test("frame health snapshots measure effective damage from every player system", () => {
  const runtime = createBossRuntime(),
    a = { hp: 100 },
    b = { hp: 80 },
    snapshot = captureEnemyHealth([a, b]);
  a.hp = 55;
  b.hp = -30;
  assert.equal(recordEnemyHealthDelta(runtime, snapshot, 4), 125);
  assert.equal(recentPlayerDps(runtime, 4), 125);
});

test("very fast boss kills raise bounded in-run boss pressure", () => {
  const runtime = createBossRuntime(),
    boss = { boss: true, kind: "warden", directorKind: "warden", directorSpawnedAt: 60 };
  const first = recordBossDefeat(runtime, boss, 62);
  assert.ok(first.fastKill > 0.9);
  assert.ok(runtime.bossPressure >= 0.45 && runtime.bossPressure <= 0.5);
  const duplicate = recordBossDefeat(runtime, boss, 63);
  assert.equal(duplicate, null);
  assert.equal(runtime.bossResults.length, 1);
});

test("health telemetry automatically learns from a melted boss", () => {
  const runtime = createBossRuntime(),
    boss = { boss: true, hp: 100, directorSpawnedAt: 10, directorKind: "prism" },
    snapshot = captureEnemyHealth([boss]);
  boss.hp = 0;
  recordEnemyHealthDelta(runtime, snapshot, 12);
  assert.ok(runtime.bossPressure > 0.4);
  assert.equal(runtime.bossResults[0].kind, "prism");
});

test("struggling against a boss eases accumulated performance pressure", () => {
  const runtime = createBossRuntime();
  runtime.bossPressure = 0.7;
  recordBossDefeat(runtime, { boss: true, directorSpawnedAt: 10 }, 50);
  assert.ok(runtime.bossPressure < 0.7);
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

test("a boss melt materially toughens the next boss without scaling damage much", () => {
  const baselineRuntime = createBossRuntime(),
    baseline = spawnDirectedBoss(baselineRuntime, {
      w: 1000,
      h: 800,
      time: 120,
      mode: "campaign",
      bossCount: 2,
      player,
      random: () => 0,
    }),
    runtime = createBossRuntime();
  runtime.bossPressure = 0.5;
  const adapted = spawnDirectedBoss(runtime, {
    w: 1000,
    h: 800,
    time: 120,
    mode: "campaign",
    bossCount: 2,
    player,
    random: () => 0,
  });
  assert.ok(adapted.hpMax > baseline.hpMax * 1.4);
  assert.ok(adapted.bossAdaptive.projectileDamage <= baseline.bossAdaptive.projectileDamage * 1.01);
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

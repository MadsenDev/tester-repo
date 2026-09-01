import assert from "node:assert/strict";
import test from "node:test";
import {
  bossDamageMultiplier,
  updateBossCounterplay,
} from "../src/boss-counterplay.js";
import {
  createBossRuntime,
  DIRECTED_BOSSES,
  spawnDirectedBoss,
} from "../src/boss-runtime.js";

const player = {
  x: 400,
  y: 300,
  damage: 18,
  shots: 1,
  fireRate: 0.42,
  crit: 0.05,
  maxHp: 100,
  items: new Set(),
  weapons: {},
  companions: {},
};

test("The Spine expands the directed boss roster", () => {
  assert.ok(DIRECTED_BOSSES.some((boss) => boss.kind === "spine"));
  const runtime = createBossRuntime(),
    spine = spawnDirectedBoss(runtime, {
      w: 900,
      h: 700,
      time: 300,
      mode: "campaign",
      bossCount: 4,
      player,
      random: () => 0.999,
    });
  assert.equal(spine.kind, "spine");
  assert.equal(spine.bossName, "THE SPINE");
  assert.equal(spine.spineSegments, 5);
});

test("The Spine sheds armor segments as health bands break", () => {
  const boss = {
    boss: true,
    kind: "spine",
    hp: 1000,
    hpMax: 1000,
    spineSegments: 5,
    spineBroken: 0,
    shootCd: 1,
    s: 30,
    baseSpineSpeed: 30,
    bossDifficulty: "normal",
    bossTuning: { movement: 1 },
    bossPhase: 1,
    positionTests: [],
  };
  assert.equal(bossDamageMultiplier(boss), 0.72);
  boss.hp = 590;
  updateBossCounterplay(boss, 0.016, player);
  assert.equal(boss.spineSegments, 3);
  assert.equal(boss.spineBroken, 2);
  assert.ok(boss.s > 30);
  assert.ok(boss.shootCd <= 0.18);

  boss.hp = 170;
  updateBossCounterplay(boss, 0.016, player);
  assert.equal(boss.spineSegments, 1);
  assert.equal(bossDamageMultiplier(boss), 1);
});

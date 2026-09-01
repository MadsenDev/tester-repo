import assert from "node:assert/strict";
import test from "node:test";
import { BOSSES } from "../src/bosses.js";
import {
  adaptiveBossTuning,
  applyAdaptiveBossScaling,
  bossTierForProgress,
  createBossDirectorState,
  eligibleBosses,
  estimateBuildPower,
  selectBoss,
} from "../src/boss-director.js";

const weakPlayer = {
  damage: 18,
  shots: 1,
  fireRate: 0.42,
  crit: 0.05,
  maxHp: 100,
  armor: 0,
  regen: 0,
  weapons: {},
  companions: {},
  items: new Set(),
};

const godPlayer = {
  damage: 180,
  shots: 5,
  fireRate: 0.12,
  crit: 0.6,
  maxHp: 260,
  armor: 0.7,
  regen: 12,
  weapons: { missile: 5, arc: 5, nova: 5, mines: 5, beam: 5 },
  companions: { blade: 4, shield: 1, ember: 1, drone: 1, wisp: 1 },
  items: new Set(Array.from({ length: 30 }, (_, i) => `m-${i}`)),
};

test("all real modes use depth-aware boss pools", () => {
  assert.equal(bossTierForProgress("expedition", { sector: 1 }), 1);
  assert.equal(bossTierForProgress("expedition", { sector: 5 }), 3);
  assert.equal(bossTierForProgress("campaign", { time: 540 }), 3);
  assert.equal(bossTierForProgress("endless", { time: 900 }), 3);
  assert.equal(bossTierForProgress("bossrush", { bossCount: 7 }), 3);
  for (const mode of ["expedition", "campaign", "endless", "bossrush"])
    assert.ok(eligibleBosses(BOSSES, mode, { time: 900, sector: 5, bossCount: 8 }).length >= 8);
});

test("controlled selection avoids immediate repeats instead of cycling a fixed roster", () => {
  const state = createBossDirectorState(),
    picks = [],
    rolls = [0, 0, 0.25, 0.25, 0.5, 0.5],
    random = () => rolls.shift() ?? 0.75;
  for (let i = 0; i < 6; i++)
    picks.push(selectBoss(BOSSES, state, { mode: "campaign", time: 540 }, random).kind);
  for (let i = 1; i < picks.length; i++) assert.notEqual(picks[i], picks[i - 1]);
  assert.ok(new Set(picks).size >= 4);
});

test("build power reacts to real damage output but stays bounded", () => {
  const weak = estimateBuildPower(weakPlayer),
    strong = estimateBuildPower(godPlayer, { recentDps: 6500 });
  assert.ok(weak < strong);
  assert.ok(weak >= 0 && strong <= 1);
});

test("adaptive boss scaling challenges strong builds without deleting the power fantasy", () => {
  const weak = adaptiveBossTuning(weakPlayer, { recentDps: 70 }, { mode: "campaign", time: 180 }),
    strong = adaptiveBossTuning(godPlayer, { recentDps: 6500 }, { mode: "endless", time: 1200, bossCount: 14 });
  assert.ok(strong.hp > weak.hp);
  assert.ok(strong.tempo > weak.tempo);
  assert.ok(strong.hp <= 1.72);
  assert.ok(strong.tempo <= 1.16);
  assert.ok(strong.projectileDamage <= 1.025);
});

test("adaptive scaling preserves current HP ratio and caps phase aggression", () => {
  const boss = {
    hp: 500,
    hpMax: 1000,
    bossTuning: {
      tempo: 1.08,
      projectileSpeed: 1.06,
      projectileDamage: 1.06,
      phaseThreshold: 0.52,
    },
  };
  applyAdaptiveBossScaling(boss, godPlayer, { recentDps: 6500 }, { mode: "endless", time: 1200, bossCount: 14 });
  assert.ok(Math.abs(boss.hp / boss.hpMax - 0.5) < 0.0001);
  assert.ok(boss.bossTuning.phaseThreshold <= 0.78);
  assert.ok(boss.bossAdaptive.hp <= 1.72);
});

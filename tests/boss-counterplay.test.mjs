import assert from "node:assert/strict";
import test from "node:test";
import {
  beginBossPhaseGate,
  bossDamageMultiplier,
  counterplayProfile,
  queuePositionTest,
  updateBossCounterplay,
} from "../src/boss-counterplay.js";

const boss = (difficulty = "normal") => ({
  boss: true,
  kind: "lastlight",
  bossPhase: 2,
  bossDifficulty: difficulty,
  arenaW: 390,
  arenaH: 780,
  phaseGate: 0,
  positionTests: [],
  positionTestCd: 99,
  positionTestFlip: false,
});

test("difficulty narrows safe corridors and accelerates tests", () => {
  const chill = counterplayProfile("chill");
  const normal = counterplayProfile("normal");
  const intense = counterplayProfile("intense");
  assert.ok(chill.gap > normal.gap && normal.gap > intense.gap);
  assert.ok(chill.warning > normal.warning && normal.warning > intense.warning);
  assert.ok(chill.damage < normal.damage && normal.damage < intense.damage);
});

test("phase gate briefly rejects burst damage", () => {
  const enemy = boss();
  beginBossPhaseGate(enemy);
  assert.equal(bossDamageMultiplier(enemy), 0);
  updateBossCounterplay(enemy, 1, { x: 195, y: 390 });
  assert.equal(bossDamageMultiplier(enemy), 1);
});

test("safe corridor rewards positioning and punishes staying outside", () => {
  const safeBoss = boss();
  const safePlayer = { x: 195, y: 390 };
  const safeTest = queuePositionTest(safeBoss, safePlayer, () => 0.5);
  let damage = 0;
  updateBossCounterplay(safeBoss, safeTest.warn + 0.01, safePlayer, (value) => { damage += value; });
  assert.equal(damage, 0);

  const exposedBoss = boss();
  const exposedPlayer = { x: 195, y: 390 };
  const exposedTest = queuePositionTest(exposedBoss, exposedPlayer, () => 0.5);
  exposedPlayer.x = 10;
  updateBossCounterplay(exposedBoss, exposedTest.warn + 0.01, exposedPlayer, (value) => { damage += value; });
  assert.equal(damage, counterplayProfile("normal").damage);
});

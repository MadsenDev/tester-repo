import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const game = fs.readFileSync(new URL("../src/game.js", import.meta.url), "utf8");
const version = fs.readFileSync(new URL("../app-version.js", import.meta.url), "utf8");
const changelog = fs.readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");

test("all live boss spawn sites use the shared director", () => {
  assert.doesNotMatch(game, /import \{ spawnBoss, updateBoss \}/);
  assert.match(game, /spawnDirectedBoss\(bossRuntime/);
  assert.match(game, /mode: "expedition"/);
  assert.match(game, /mode: settings\.mode/);
});

test("new runs reset boss history and live damage telemetry is sampled", () => {
  assert.match(game, /bossRuntime = createBossRuntime\(\)/);
  assert.match(game, /const damageSnapshot = captureEnemyHealth\(enemies\)/);
  assert.match(game, /recordEnemyHealthDelta\(bossRuntime, damageSnapshot, time\)/);
});

test("the live boss director rollout remains documented as versions advance", () => {
  assert.match(version, /ORBITAL_APP_VERSION = "\d+\.\d+\.\d+"/);
  assert.match(changelog, /## \[0\.43\.8\]/);
  assert.match(changelog, /Last Stand, Endless and Boss Rush/);
});

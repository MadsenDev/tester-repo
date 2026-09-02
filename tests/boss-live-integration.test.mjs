import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const game = fs.readFileSync(
  new URL("../src/game.js", import.meta.url),
  "utf8",
);
const gameRuntime = fs.readFileSync(
  new URL("../src/game-runtime.js", import.meta.url),
  "utf8",
);
const expeditionRuntime = fs.readFileSync(
  new URL("../src/expedition-runtime.js", import.meta.url),
  "utf8",
);
const liveBossSources = `${game}\n${gameRuntime}\n${expeditionRuntime}`;
const version = fs.readFileSync(
  new URL("../app-version.js", import.meta.url),
  "utf8",
);
const changelog = fs.readFileSync(
  new URL("../CHANGELOG.md", import.meta.url),
  "utf8",
);

test("all live boss spawn sites use the shared director", () => {
  assert.doesNotMatch(liveBossSources, /import \{ spawnBoss, updateBoss \}/);
  assert.match(liveBossSources, /spawnDirectedBoss\(/);
  assert.match(expeditionRuntime, /mode: "expedition"/);
  assert.match(gameRuntime, /mode: runtime\.settings\.mode/);
});

test("new runs reset boss history and live damage telemetry is sampled", () => {
  assert.match(game, /bossRuntime = createBossRuntime\(\)/);
  assert.match(
    gameRuntime,
    /const damageSnapshot = captureEnemyHealth\(runtime\.enemies\)/,
  );
  assert.match(
    gameRuntime,
    /recordEnemyHealthDelta\(runtime\.bossRuntime, damageSnapshot, runtime\.time\)/,
  );
});

test("the live boss director rollout remains documented as versions advance", () => {
  assert.match(version, /ORBITAL_APP_VERSION = "\d+\.\d+\.\d+"/);
  assert.match(changelog, /## \[0\.43\.8\]/);
  assert.match(changelog, /Last Stand, Endless and Boss Rush/);
});

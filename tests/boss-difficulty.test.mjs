import assert from "node:assert/strict";
import test from "node:test";
import {
  bossDifficulty,
  predictiveTarget,
  prepareBossArena,
  regularEnemiesAllowed,
} from "../src/boss-difficulty.js";
import { spawnBoss, updateBoss } from "../src/bosses.js";

test("Chill and Normal clear the arena and suspend regular spawns", () => {
  const enemies = [
      { kind: "scout", boss: false },
      { kind: "warden", boss: true },
    ],
    bullets = [{ damage: 10 }];

  for (const difficulty of ["chill", "normal"]) {
    const arena = prepareBossArena(enemies, bullets, difficulty);
    assert.deepEqual(arena.enemies, [{ kind: "warden", boss: true }]);
    assert.deepEqual(arena.enemyBullets, []);
    assert.equal(regularEnemiesAllowed(difficulty, true), false);
  }
});

test("Intense preserves enemies and keeps spawning during bosses", () => {
  const enemies = [{ kind: "scout", boss: false }],
    bullets = [{ damage: 10 }],
    arena = prepareBossArena(enemies, bullets, "intense");

  assert.equal(arena.enemies, enemies);
  assert.equal(arena.enemyBullets, bullets);
  assert.equal(regularEnemiesAllowed("intense", true), true);
});

test("boss profiles scale durability, tempo, phases and predictive aim", () => {
  const chill = spawnBoss(1000, 800, 60, "chill"),
    normal = spawnBoss(1000, 800, 60, "normal"),
    intense = spawnBoss(1000, 800, 60, "intense"),
    movingPlayer = { x: 400, y: 300, vx: 100, vy: -50 };

  assert.ok(chill.hp < normal.hp && normal.hp < intense.hp);
  assert.ok(
    bossDifficulty("chill").tempo < bossDifficulty("normal").tempo &&
      bossDifficulty("normal").tempo < bossDifficulty("intense").tempo,
  );
  assert.ok(
    bossDifficulty("chill").phaseThreshold <
      bossDifficulty("normal").phaseThreshold,
  );
  assert.deepEqual(
    predictiveTarget(movingPlayer, bossDifficulty("chill"), 1000, 800),
    { x: 400, y: 300 },
  );
  assert.ok(
    predictiveTarget(movingPlayer, bossDifficulty("intense"), 1000, 800).x >
      400,
  );
});

test("the live boss loop applies difficulty-specific phases and projectiles", () => {
  const runFrame = (difficulty, hpRatio) => {
    const boss = spawnBoss(1000, 800, 60, difficulty),
      enemyBullets = [];
    boss.x = 500;
    boss.y = 200;
    boss.hp = boss.hpMax * hpRatio;
    boss.shootCd = 0;
    updateBoss(boss, 0.1, {
      player: { x: 500, y: 600, vx: 0, vy: 0 },
      enemyBullets,
      particles: [],
      time: 60,
      onShake() {},
    });
    return { boss, enemyBullets };
  };

  const chill = runFrame("chill", 0.4),
    normal = runFrame("normal", 0.4),
    intense = runFrame("intense", 0.4);

  assert.equal(chill.boss.bossPhase, 1);
  assert.equal(normal.boss.bossPhase, 2);
  assert.equal(intense.boss.bossPhase, 2);
  assert.ok(chill.enemyBullets.length < normal.enemyBullets.length);
  assert.ok(
    chill.enemyBullets[0].damage < normal.enemyBullets[0].damage &&
      normal.enemyBullets[0].damage < intense.enemyBullets[0].damage,
  );
});

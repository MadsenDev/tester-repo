import assert from "node:assert/strict";
import test from "node:test";
import { updateArenaModules } from "../src/arena-modules.js";

const player = () => ({
  x: 100,
  y: 100,
  r: 11,
  damage: 20,
  specials: new Set(["execution-mark"]),
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

const update = (p, enemies) =>
  updateArenaModules(p, 0.016, {
    enemies,
    bullets: [],
    enemyBullets: [],
    time: 1,
    W: 400,
    H: 300,
  });

test("Execution Mark abandons a living target removed during a boss transition", () => {
  const p = player();
  const normal = enemy(150, 100);
  update(p, [normal]);
  assert.equal(p.arenaRuntime.mark, normal);

  const boss = enemy(180, 100, { boss: true, r: 28, hp: 1200, hpMax: 1200 });
  update(p, [boss]);

  assert.equal(normal.arenaMarked, false);
  assert.equal(p.arenaRuntime.mark, boss);
  assert.equal(boss.arenaMarked, true);
});

test("Execution Mark recovers after a boss is removed without a kill callback", () => {
  const p = player();
  const boss = enemy(180, 100, { boss: true, r: 28, hp: 1200, hpMax: 1200 });
  update(p, [boss]);
  assert.equal(p.arenaRuntime.mark, boss);

  const normal = enemy(145, 100);
  update(p, [normal]);

  assert.equal(boss.arenaMarked, false);
  assert.equal(p.arenaRuntime.mark, normal);
  assert.equal(normal.arenaMarked, true);
});

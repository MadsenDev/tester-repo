import assert from "node:assert/strict";
import test from "node:test";
import {
  attractPowerup,
  dropProfile,
  rollPowerupDrop,
} from "../src/drop-economy.js";

const player = { x: 200, y: 100, hp: 40, maxHp: 100 };

test("drop generosity decreases with difficulty", () => {
  const chill = dropProfile("chill"),
    normal = dropProfile("normal"),
    intense = dropProfile("intense");

  assert.ok(
    chill.regularChance > normal.regularChance &&
      normal.regularChance > intense.regularChance,
  );
  assert.ok(
    chill.repairWeight > normal.repairWeight &&
      normal.repairWeight > intense.repairWeight,
  );
  assert.ok(
    chill.attractionRadius > normal.attractionRadius &&
      normal.attractionRadius > intense.attractionRadius,
  );
  assert.ok(
    chill.pityKills < normal.pityKills && normal.pityKills < intense.pityKills,
  );
});

test("repair pity guarantees recovery after a long drought", () => {
  for (const difficulty of ["chill", "normal", "intense"]) {
    const profile = dropProfile(difficulty),
      drop = rollPowerupDrop(
        { boss: false, elite: false },
        difficulty,
        player,
        profile.pityKills,
        () => 0.999,
      );
    assert.equal(drop.kind, "repair");
    assert.ok(drop.value > 0);
  }
});

test("wounded boss kills guarantee a repair drop", () => {
  const drop = rollPowerupDrop(
    { boss: true, elite: false },
    "normal",
    player,
    0,
    () => 0.999,
  );
  assert.equal(drop.kind, "repair");
});

test("powerups attract within the difficulty-specific pickup radius", () => {
  const powerup = {
    x: 100,
    y: 100,
    attractionRadius: 210,
    attractionSpeed: 210,
  };
  attractPowerup(powerup, player, 0.25);
  assert.ok(powerup.x > 100);
  assert.equal(powerup.y, 100);
});

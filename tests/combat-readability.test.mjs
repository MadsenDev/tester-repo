import assert from "node:assert/strict";
import test from "node:test";
import {
  applyFriendlyVisualBudget,
  compressSalvage,
  friendlyThreatAlpha,
  friendlyVisualLimit,
  salvageLimit,
} from "../src/combat-readability.js";

test("salvage consolidation preserves total XP value", () => {
  const gems = Array.from({ length: 600 }, (_, i) => ({
    x: (i * 37) % 390,
    y: (i * 61) % 780,
    v: 1 + (i % 5),
    r: 4,
  }));
  const expected = gems.reduce((sum, gem) => sum + gem.v, 0);
  const compressed = compressSalvage(gems, { width: 390, height: 780 });
  assert.ok(compressed.length <= salvageLimit(390, 780));
  assert.equal(compressed.reduce((sum, gem) => sum + gem.v, 0), expected);
  assert.ok(compressed.some((gem) => gem.stack > 1));
});

test("friendly visual budget never removes mechanical projectiles", () => {
  const bullets = Array.from({ length: 500 }, (_, i) => ({
    x: (i * 17) % 390,
    y: (i * 29) % 780,
    damage: 8 + (i % 7),
    kind: "blaster",
  }));
  const totalDamage = bullets.reduce((sum, bullet) => sum + bullet.damage, 0);
  const sameArray = applyFriendlyVisualBudget(bullets, {
    width: 390,
    height: 780,
    player: { x: 195, y: 390 },
  });
  assert.equal(sameArray, bullets);
  assert.equal(bullets.reduce((sum, bullet) => sum + bullet.damage, 0), totalDamage);
  assert.ok(bullets.filter((bullet) => bullet.visualAlpha > 0).length <= friendlyVisualLimit(390, 780));
});

test("friendly fire yields visual priority near hostile shots", () => {
  const bullet = { x: 100, y: 100, visualAlpha: 1 };
  assert.equal(friendlyThreatAlpha(bullet, [{ x: 120, y: 100 }]), 0.16);
  assert.equal(friendlyThreatAlpha(bullet, [{ x: 180, y: 100 }]), 0.42);
  assert.equal(friendlyThreatAlpha(bullet, [{ x: 260, y: 100 }]), 1);
});

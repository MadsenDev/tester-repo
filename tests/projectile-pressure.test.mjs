import assert from "node:assert/strict";
import test from "node:test";
import {
  projectileLimit,
  regulateProjectilePressure,
} from "../src/projectile-pressure.js";

test("projectile pressure is bounded by difficulty and viewport", () => {
  const chill = projectileLimit("chill", 600, 390, 844),
    normal = projectileLimit("normal", 600, 390, 844),
    intense = projectileLimit("intense", 600, 390, 844);

  assert.ok(chill < normal);
  assert.equal(intense, Infinity);
  assert.ok(normal < projectileLimit("normal", 600, 1280, 720));
});

test("Chill and Normal retire excess hostile projectiles", () => {
  const player = { x: 195, y: 422 },
    bullets = Array.from({ length: 240 }, (_, id) => ({
      id,
      x: id === 0 ? player.x + 2 : 800 + id,
      y: id === 0 ? player.y + 2 : 900,
      life: 1 + id / 100,
    }));
  bullets.push({ id: "rail", kind: "rail", x: 1000, y: 1000, life: 0.1 });

  const regulated = regulateProjectilePressure(bullets, {
    difficulty: "normal",
    time: 600,
    width: 390,
    height: 844,
    player,
  });

  assert.equal(
    regulated.length,
    projectileLimit("normal", 600, 390, 844),
  );
  assert.ok(regulated.some(({ id }) => id === 0));
  assert.ok(regulated.some(({ id }) => id === "rail"));
  assert.ok(regulated.length < bullets.length);
});

test("Intense leaves the full bullet hell intact", () => {
  const bullets = Array.from({ length: 500 }, (_, id) => ({
    id,
    x: id,
    y: id,
    life: 5,
  }));
  const regulated = regulateProjectilePressure(bullets, {
    difficulty: "intense",
    time: 600,
    width: 390,
    height: 844,
  });

  assert.equal(regulated, bullets);
  assert.equal(regulated.length, 500);
});

test("unknown difficulty falls back to Normal", () => {
  assert.equal(
    projectileLimit("unknown", 420, 800, 600),
    projectileLimit("normal", 420, 800, 600),
  );
});

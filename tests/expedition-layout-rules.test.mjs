import assert from "node:assert/strict";
import test from "node:test";
import {
  EXPEDITION_REST_CHANCE,
  generateExpeditionMap,
  validateExpeditionLayout,
} from "../src/expedition.js";

const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};

const byId = (map) => new Map(map.nodes.map((node) => [node.id, node]));

test("optional economy rooms never gate the Expedition boss", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const map = generateExpeditionMap(1, seeded(seed));
    assert.deepEqual(validateExpeditionLayout(map), [], `seed ${seed}`);
    const nodes = byId(map);
    for (const id of map.criticalPath) {
      const node = nodes.get(id);
      assert.ok(id === map.bossId || node.type === "combat", `${node.type} gates boss for seed ${seed}`);
    }
  }
});

test("shop, module and choice rooms are terminal optional branches", () => {
  for (let seed = 1; seed <= 100; seed++) {
    const map = generateExpeditionMap(2, seeded(seed));
    for (const type of ["shop", "item", "choice"] ) {
      const room = map.nodes.find((node) => node.type === type);
      assert.ok(room, `seed ${seed} lacks ${type}`);
      assert.equal(Object.keys(room.links).length, 1, `${type} is a corridor for seed ${seed}`);
      assert.equal(map.criticalPath.includes(room.id), false);
    }
  }
});

test("Rest Bays are rare rather than guaranteed recovery rooms", () => {
  let restSectors = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const map = generateExpeditionMap(1, seeded(seed));
    if (map.restId) {
      restSectors++;
      const room = byId(map).get(map.restId);
      assert.equal(room.type, "repair");
      assert.equal(Object.keys(room.links).length, 1);
      assert.equal(map.criticalPath.includes(room.id), false);
    }
  }
  assert.equal(EXPEDITION_REST_CHANCE, 0.12);
  assert.ok(restSectors > 10 && restSectors < 80, `unexpected Rest Bay frequency: ${restSectors}/300`);
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  EXPEDITION_ENCOUNTERS,
  assignExpeditionEncounters,
  createExpeditionEncounterRuntime,
  damageExpeditionEnemy,
  drawExpeditionEncounter,
  expeditionEnemyKind,
  updateExpeditionEncounter,
} from "../src/expedition-encounters.js";
import { moveEnemy } from "../src/enemy-ai.js";
import { ARCHETYPES, spawnEnemy } from "../src/entities.js";

const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};

test("sector progression unlocks controlled encounter variety", () => {
  const nodes = Array.from({ length: 12 }, (_, index) => ({
    id: `r${index}`,
    type: index % 4 === 3 ? "item" : index % 3 === 2 ? "elite" : "combat",
  }));
  assignExpeditionEncounters(nodes, 1, seeded(4));
  assert.ok(nodes.filter((node) => node.encounterId).every((node) => ["open", "shield-line"].includes(node.encounterId)));
  assignExpeditionEncounters(nodes, 5, seeded(12));
  const combat = nodes.filter((node) => node.encounterId);
  assert.ok(new Set(combat.map((node) => node.encounterId)).size >= 4);
  assert.ok(combat.every((node, index) => !index || node.encounterId !== combat[index - 1].encounterId));
  assert.equal(nodes.filter((node) => node.type === "item").every((node) => node.encounterId === null), true);
});

test("each authored encounter opens at its intended sector", () => {
  assert.deepEqual(
    EXPEDITION_ENCOUNTERS.map(({ id, minSector }) => [id, minSector]),
    [
      ["open", 1], ["shield-line", 1], ["gravity-knot", 2],
      ["crossfire", 2], ["relay-web", 3], ["breach", 4],
    ],
  );
});

test("signature enemies make room rules legible", () => {
  const expected = {
    "shield-line": "bulwark",
    "gravity-knot": "anchor",
    crossfire: "sentinel",
    "relay-web": "relay",
    breach: "burrower",
  };
  for (const [encounterId, kind] of Object.entries(expected))
    assert.equal(expeditionEnemyKind({ encounterId, sector: 5 }, 0, seeded(8)), kind);
});

test("support enemies shield and redistribute damage", () => {
  const bulwark = { kind: "bulwark", x: 100, y: 100, hp: 100 },
    protectedEnemy = { kind: "scout", x: 140, y: 100, hp: 100 },
    relay = { kind: "relay", x: 300, y: 100, hp: 100 },
    enemies = [bulwark, protectedEnemy, relay],
    runtime = createExpeditionEncounterRuntime("relay-web", 360, 700, seeded(3));
  updateExpeditionEncounter(runtime, 0.1, {
    player: { x: 300, y: 400 }, bullets: [], enemyBullets: [], enemies,
    hurt() {}, W: 360, H: 700,
  });
  assert.equal(protectedEnemy.shielded, true);
  relay.relayPartner = protectedEnemy;
  damageExpeditionEnemy(relay, 30, enemies);
  assert.equal(relay.hp, 79);
  assert.equal(protectedEnemy.hp, 91);
});

test("new enemy roles have distinct live behavior", () => {
  for (const kind of ["anchor", "relay", "burrower"])
    assert.ok(ARCHETYPES.some((enemy) => enemy.kind === kind));
  const player = { x: 240, y: 360 }, enemyBullets = [], particles = [];
  for (const kind of ["anchor", "relay", "burrower"]) {
    const enemy = spawnEnemy(360, 700, 500, 0, false, kind);
    enemy.x = 120; enemy.y = 300; enemy.shootCd = 0; enemy.chargeCd = 0;
    moveEnemy(enemy, 0.1, { player, enemyBullets, particles, time: 500 });
    assert.ok(Number.isFinite(enemy.x) && Number.isFinite(enemy.y));
  }
  assert.ok(enemyBullets.length >= 9);
});

test("every distinct room mechanic updates and renders on mobile", () => {
  const ctx = new Proxy(
    { measureText: (value) => ({ width: String(value).length * 5 }) },
    { get(target, property) { return property in target ? target[property] : () => {}; }, set(target, property, value) { target[property] = value; return true; } },
  );
  for (const encounter of EXPEDITION_ENCOUNTERS) {
    const runtime = createExpeditionEncounterRuntime(encounter.id, 360, 700, seeded(16)),
      world = { player: { x: 180, y: 420 }, bullets: [], enemyBullets: [], enemies: [], hurt() {}, W: 360, H: 700 };
    assert.doesNotThrow(() => updateExpeditionEncounter(runtime, 0.1, world));
    assert.doesNotThrow(() => drawExpeditionEncounter(ctx, runtime, 1, 360, 700));
  }
});

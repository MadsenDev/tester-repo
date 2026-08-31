import assert from "node:assert/strict";
import test from "node:test";
import {
  activeManifestations,
  syncManifestations,
  updateManifestations,
} from "../src/manifestations.js";

function apexPlayer() {
  return {
    x: 100,
    y: 100,
    damage: 50,
    passives: {
      multishot: 1,
      pierce: 1,
      missile: 1,
      arc: 1,
      size: 1,
      nova: 1,
      mines: 1,
      "ember-familiar": 1,
      "wisp-familiar": 1,
      "aegis-orbit": 1,
      "drone-familiar": 1,
      "transform-storm": 1,
      "transform-recursive": 1,
      "transform-horizon": 1,
      "transform-thunder-choir": 1,
      "transform-guardian-swarm": 1,
    },
    weapons: {},
    companions: { ember: 1, wisp: 1, shield: 1, drone: 1 },
  };
}

test("the five showcase apex manifestations activate from existing traits", () => {
  assert.deepEqual(
    activeManifestations(apexPlayer()).map(({ id }) => id),
    [
      "seekingStorm",
      "recursiveViolence",
      "eventHorizon",
      "thunderChoir",
      "guardianSwarm",
    ],
  );
});

test("manifestation activation is announced only once per run", () => {
  const player = apexPlayer(),
    first = syncManifestations(player),
    second = syncManifestations(player);

  assert.equal(first.length, 5);
  assert.equal(second.length, 0);
  assert.equal(player.manifestationCue.name, "APEX CONVERGENCE");
  assert.deepEqual(player.manifestations, first.map(({ id }) => id));
});

test("Thunder Choir performs a synchronized familiar discharge", () => {
  const player = apexPlayer(),
    enemies = [
      { x: 130, y: 100, hp: 100, targetable: true },
      { x: 160, y: 100, hp: 100, targetable: true },
    ];
  syncManifestations(player);
  updateManifestations(player, 0.1, { enemies, enemyBullets: [] });

  assert.ok(enemies.every(({ hp }) => hp < 100));
  assert.ok(player.manifestationFx.some(({ kind }) => kind === "choir"));
});

test("Guardian Swarm intercepts ordinary fire but preserves boss rails", () => {
  const player = apexPlayer(),
    enemyBullets = [
      { x: 105, y: 100, kind: "ordinary" },
      { x: 108, y: 100, kind: "ordinary" },
      { x: 110, y: 100, kind: "rail" },
      { x: 500, y: 500, kind: "ordinary" },
    ];
  syncManifestations(player);
  updateManifestations(player, 0.1, { enemies: [], enemyBullets });

  assert.equal(enemyBullets.filter(({ kind }) => kind === "ordinary").length, 1);
  assert.ok(enemyBullets.some(({ kind }) => kind === "rail"));
  assert.ok(player.manifestationFx.some(({ kind }) => kind === "guard"));
});

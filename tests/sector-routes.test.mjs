import assert from "node:assert/strict";
import test from "node:test";
import {
  combineModifiers,
  createRouteState,
  routeChoices,
  routeDue,
  routeLeg,
  routeModifiers,
  selectRoute,
} from "../src/sector-routes.js";

test("route boundaries start every two minutes", () => {
  assert.equal(routeLeg(119.99), 0);
  assert.equal(routeLeg(120), 1);
  assert.equal(routeLeg(600), 5);
});

test("a resolved leg cannot reopen", () => {
  const state = createRouteState();
  assert.equal(routeDue(state, 120), true);
  state.resolvedLeg = 1;
  assert.equal(routeDue(state, 120.5), false);
  assert.equal(routeDue(state, 240), true);
});

test("choices cover readable risk bands and do not repeat the previous route", () => {
  const state = createRouteState();
  state.history.push("quiet-line");
  const choices = routeChoices(state, () => 0.5);
  assert.equal(choices.length, 3);
  assert.equal(
    choices.some((route) => route.id === "quiet-line"),
    false,
  );
  assert.deepEqual(
    new Set(choices.map((route) => route.risk)),
    new Set(["BALANCED", "DANGEROUS", "VOLATILE"]),
  );
});

test("selecting a route applies its permanent reward and temporary modifiers", () => {
  const player = { damage: 10, xpGain: 1 };
  const state = createRouteState();
  selectRoute(state, "black-signal", player, 2);
  assert.equal(player.damage, 11);
  assert.equal(player.xpGain, 1.08);
  assert.equal(state.resolvedLeg, 2);
  assert.equal(routeModifiers(state).spawn, 1.28);
});

test("event and route modifiers combine without losing either system", () => {
  const combined = combineModifiers(
    { fire: 0.5, enemySpeed: 1.2, magnet: 1, elite: 0.38, score: 1.5 },
    {
      fire: 1,
      enemySpeed: 1.1,
      magnet: 2,
      elite: 0.24,
      score: 1.4,
      spawn: 1.2,
      xp: 1,
      damageTaken: 1.22,
    },
  );
  assert.equal(combined.fire, 0.5);
  assert.equal(combined.enemySpeed, 1.32);
  assert.equal(combined.elite, 0.62);
  assert.ok(Math.abs(combined.score - 2.1) < Number.EPSILON * 4);
  assert.equal(combined.damageTaken, 1.22);
});

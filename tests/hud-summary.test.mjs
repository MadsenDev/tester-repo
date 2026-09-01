import assert from "node:assert/strict";
import test from "node:test";
import { compactArsenalLabel } from "../src/hud-summary.js";

test("fresh-run HUD does not require a legacy upgrades array", () => {
  assert.equal(
    compactArsenalLabel({ shipName: "STRIDER" }, [], "BLASTER"),
    "STRIDER · 0 MODULES · BLASTER",
  );
});

test("HUD counts the actual item loadout and highlights apex synergies", () => {
  const player = {
    shipName: "STRIDER",
    items: new Set(Array.from({ length: 19 }, (_, index) => `module-${index}`)),
  };
  assert.equal(
    compactArsenalLabel(player, [{ apex: true, name: "PRISMATIC RAZOR" }], "BLASTER"),
    "STRIDER · 19 MODULES · PRISMATIC RAZOR",
  );
  assert.equal(
    compactArsenalLabel(player, [{ apex: true }, { apex: true }], "BLASTER"),
    "STRIDER · 19 MODULES · 2 APEX SYNERGIES",
  );
});

test("HUD still accepts legacy array-backed loadouts", () => {
  assert.equal(
    compactArsenalLabel({ shipName: "STRIDER", items: [{}, {}, {}] }, [], "BLASTER"),
    "STRIDER · 3 MODULES · BLASTER",
  );
});

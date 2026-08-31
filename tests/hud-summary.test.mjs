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
  const player = { shipName: "STRIDER", items: [{}, {}, {}] };
  assert.equal(
    compactArsenalLabel(player, [{ apex: true, name: "PRISMATIC RAZOR" }], "BLASTER"),
    "STRIDER · 3 MODULES · PRISMATIC RAZOR",
  );
  assert.equal(
    compactArsenalLabel(player, [{ apex: true }, { apex: true }], "BLASTER"),
    "STRIDER · 3 MODULES · 2 APEX SYNERGIES",
  );
});

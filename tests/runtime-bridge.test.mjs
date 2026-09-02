import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("runtime systems can replace every collection exposed by the game bridge", () => {
  const game = read("src/game.js");
  const systems = [
    read("src/game-runtime.js"),
    read("src/expedition-runtime.js"),
    read("src/combat-actions.js"),
  ].join("\n");
  const assignedProperties = new Set(
    [...systems.matchAll(/runtime\.([A-Za-z][A-Za-z0-9]*)\s*=/g)].map(
      (match) => match[1],
    ),
  );
  const setters = new Set(
    [...game.matchAll(/set\s+([A-Za-z][A-Za-z0-9]*)\s*\(/g)].map(
      (match) => match[1],
    ),
  );

  for (const property of assignedProperties)
    assert.ok(setters.has(property), `runtime.${property} needs a bridge setter`);
});

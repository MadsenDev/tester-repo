import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the deployed game module cache key includes the fresh-run HUD fix", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const match = html.match(/src\/game\.js\?v=(\d+)/);
  assert.ok(match, "index.html must version the game module");
  assert.ok(Number(match[1]) >= 35, "game.js cache key must include the HUD crash fix");
});

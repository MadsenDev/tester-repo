import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("the primary menu exposes five focused destinations", () => {
  const html = read("index.html");
  const nav = html.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || "";
  assert.equal((nav.match(/data-nav=/g) || []).length, 5);
  for (const destination of ["menu", "core", "hangar", "archive", "more"])
    assert.match(nav, new RegExp(`data-nav="${destination}"`));
  assert.doesNotMatch(nav, /data-nav="(?:stats|settings)"/);
});

test("the flight deck avoids duplicate chassis selectors", () => {
  const html = read("index.html");
  assert.equal((html.match(/id="shipSelect"/g) || []).length, 1);
  assert.match(html, /id="shipSelect" class="ship-hero"/);
  assert.match(html, /id="modeSelect" class="command-row"/);
  assert.match(html, /id="homeDifficulty" class="command-row"/);
  assert.doesNotMatch(html, /class="home-card compact-select"/);
});

test("the active chassis keeps its animated force shield", () => {
  const html = read("index.html");
  const css = read("mobile-design.css");
  assert.match(html, /class="shield-field"/);
  assert.equal((html.match(/shield-field-(?:plane|edge|core)/g) || []).length, 3);
  assert.match(css, /@keyframes shield-spin/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});

test("secondary destinations live in the More directory", () => {
  const html = read("index.html");
  const more = html.match(/<section id="more"[\s\S]*?<\/section>/)?.[0] || "";
  assert.match(more, /id="openStats"/);
  assert.match(more, /id="openPlayground"/);
  assert.match(more, /id="openSettings"/);
  assert.match(read("src/shell-ui.js"), /b\.dataset\.back \|\| "menu"/);
});

test("launch reads the latest shell selection", () => {
  const game = read("src/game.js");
  const start = game.slice(game.indexOf("function start()"), game.indexOf("function finish"));
  assert.match(start, /settings = loadSettings\(\)/);
});

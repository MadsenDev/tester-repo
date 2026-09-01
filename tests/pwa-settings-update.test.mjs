import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const pwa = fs.readFileSync(new URL("../src/pwa.js", import.meta.url), "utf8");
const version = fs.readFileSync(new URL("../app-version.js", import.meta.url), "utf8");
const changelog = fs.readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");

test("Settings exposes a manual service-worker update check", () => {
  assert.match(pwa, /id = "checkForUpdates"/);
  assert.match(pwa, /Check for updates/);
  assert.match(pwa, /await registrationRef\.update\(\)/);
  assert.match(pwa, /registrationRef\.waiting/);
  assert.match(pwa, /UP TO DATE/);
  assert.match(pwa, /UPDATE NOW/);
});

test("the updater release remains documented as versions advance", () => {
  assert.match(version, /ORBITAL_APP_VERSION = "\d+\.\d+\.\d+"/);
  assert.match(changelog, /## \[0\.43\.6\]/);
  assert.match(changelog, /Execution Mark/);
  assert.match(changelog, /Check for updates/);
});

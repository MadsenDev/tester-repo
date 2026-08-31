import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("the application exposes one semantic version source", () => {
  const version = read("app-version.js").match(/ORBITAL_APP_VERSION = "([^"]+)"/)?.[1];
  assert.match(version || "", /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
  assert.match(read("service-worker.js"), /importScripts\("\.\/app-version\.js"/);
  assert.match(read("src/pwa.js"), /ORBITAL_APP_VERSION/);
});

test("the page is installable and registers its updater", () => {
  const html = read("index.html");
  assert.match(html, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(html, /src="\.\/app-version\.js"/);
  assert.match(html, /src="\.\/src\/pwa\.js/);
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  assert.ok(manifest.icons.some((icon) => icon.purpose.includes("maskable")));
  assert.match(read("src/pwa.js"), /updateViaCache: "none"/);
});

test("every runtime module and stylesheet is available offline", async () => {
  await import(new URL("../precache-manifest.js", import.meta.url));
  const assets = new Set(globalThis.ORBITAL_PRECACHE);
  const modules = readdirSync(new URL("../src/", import.meta.url))
    .filter((name) => name.endsWith(".js"))
    .map((name) => `./src/${name}`);
  const styles = readdirSync(root)
    .filter((name) => name.endsWith(".css"))
    .map((name) => `./${name}`);
  for (const path of [...modules, ...styles]) {
    assert.ok(assets.has(path), `${path} is missing from the offline shell`);
  }
  for (const required of ["./", "./index.html", "./manifest.webmanifest", "./app-version.js", "./icons/app-icon.svg", "./icons/icon-192.png", "./icons/icon-512.png"]) {
    assert.ok(assets.has(required), `${required} is missing from the offline shell`);
  }
});

test("updates remain waiting until the player accepts them", () => {
  const worker = read("service-worker.js");
  const installHandler = worker.slice(worker.indexOf('addEventListener("install"'), worker.indexOf('addEventListener("activate"'));
  assert.doesNotMatch(installHandler, /skipWaiting/);
  assert.match(worker, /data\?\.type === "SKIP_WAITING"/);
  assert.match(read("src/pwa.js"), /UPDATE NOW/);
});

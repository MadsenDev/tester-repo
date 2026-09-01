import { readFile, writeFile } from "node:fs/promises";

const next = process.argv[2];
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(next || "")) {
  console.error("Usage: node scripts/set-version.mjs <semver>");
  process.exit(1);
}
const url = new URL("../app-version.js", import.meta.url);
const source = await readFile(url, "utf8");
const updated = source.replace(
  /ORBITAL_APP_VERSION = "[^"]+"/,
  `ORBITAL_APP_VERSION = "${next}"`,
);
if (!/ORBITAL_APP_VERSION = "[^"]+"/.test(source)) {
  throw new Error("Could not find ORBITAL_APP_VERSION");
}
if (source === updated) {
  console.log(`Orbital Last Stand is already ${next}`);
} else {
  await writeFile(url, updated);
  console.log(`Orbital Last Stand version set to ${next}`);
}

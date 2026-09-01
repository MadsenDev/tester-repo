import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("mobile module cards override the legacy choice grid", async () => {
  const css = await readFile(
    new URL("../mobile-design.css", import.meta.url),
    "utf8",
  );

  assert.match(
    css,
    /#overlay\.gameplay-modal \.module-choice\s*{[^}]*display:\s*block\s*!important/s,
  );
  assert.match(
    css,
    /#overlay\.gameplay-modal \.module-choice-main\s*{[^}]*display:\s*flex\s*!important/s,
  );
});

test("the updated mobile stylesheet bypasses the deployed cache", async () => {
  const html = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8",
  );

  assert.match(html, /mobile-design\.css\?v=3/);
});

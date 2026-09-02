import { readdir, readFile } from "node:fs/promises";

const SOURCE_DIRECTORY = new URL("../src/", import.meta.url);
const WARNING_LIMIT = 400;
const HARD_LIMIT = 600;

const entries = await readdir(SOURCE_DIRECTORY, { withFileTypes: true });
const files = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
  .map((entry) => entry.name)
  .sort();

const oversized = [];
for (const file of files) {
  const source = await readFile(new URL(file, SOURCE_DIRECTORY), "utf8");
  const lines = source.split("\n").length;
  if (lines > HARD_LIMIT) oversized.push({ file, lines });
  else if (lines > WARNING_LIMIT)
    console.warn(`Maintenance warning: src/${file} has ${lines} lines`);
}

if (oversized.length) {
  for (const { file, lines } of oversized)
    console.error(
      `Maintenance failure: src/${file} has ${lines} lines (maximum ${HARD_LIMIT})`,
    );
  process.exitCode = 1;
} else {
  console.log(
    `Maintainability check passed: ${files.length} source files are within ${HARD_LIMIT} lines`,
  );
}

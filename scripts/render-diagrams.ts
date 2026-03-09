import { renderMermaidSVG, THEMES } from "beautiful-mermaid";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, basename } from "node:path";

const SRC_DIR = "docs/capstone/diagrams/src";
const OUT_DIR = "docs/capstone/diagrams/rendered";
const THEME = THEMES["github-light"];

await mkdir(OUT_DIR, { recursive: true });

const files = (await readdir(SRC_DIR)).filter((f) => f.endsWith(".mmd"));

let count = 0;
for (const file of files) {
  const src = await readFile(join(SRC_DIR, file), "utf-8");
  const svg = renderMermaidSVG(src.trim(), THEME);
  const outPath = join(OUT_DIR, file.replace(".mmd", ".svg"));
  await writeFile(outPath, svg);
  console.log(`✓ ${outPath}`);
  count++;
}

console.log(`\nDone. ${count} diagrams rendered to ${OUT_DIR}/`);

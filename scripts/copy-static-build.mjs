/**
 * Copy Next static export (`out/`) to `build/` for CRA-style deploy path:
 * /var/www/apps/dealer/current/build
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "out");
const buildDir = path.join(root, "build");

if (!fs.existsSync(outDir)) {
  console.error("Missing out/ — run `next build` first.");
  process.exit(1);
}

fs.rmSync(buildDir, { recursive: true, force: true });
fs.cpSync(outDir, buildDir, { recursive: true });
console.log("Copied out/ → build/");

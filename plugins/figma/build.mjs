import * as esbuild from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes("--watch");

await mkdir(path.join(__dirname, "dist"), { recursive: true });

const ctx = await esbuild.context({
  entryPoints: [path.join(__dirname, "src/code.ts")],
  bundle: true,
  outfile: path.join(__dirname, "dist/code.js"),
  target: "es2017",
  format: "iife",
  logLevel: "info",
});

async function buildUi() {
  const html = await readFile(path.join(__dirname, "src/ui.html"), "utf8");
  await writeFile(path.join(__dirname, "dist/ui.html"), html, "utf8");
}

await buildUi();

if (watch) {
  await ctx.watch();
  console.log("Watching Figma plugin…");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log("Built plugins/figma/dist");
}

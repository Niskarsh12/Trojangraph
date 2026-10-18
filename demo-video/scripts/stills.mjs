// Renders preview stills for visual QA: node scripts/stills.mjs Comp:frame Comp:frame ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const targets = process.argv.slice(2).map((t) => {
  const [id, frame] = t.split(":");
  return { id, frame: Number(frame) };
});

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const cache = new Map();
for (const { id, frame } of targets) {
  if (!cache.has(id)) {
    cache.set(id, await selectComposition({ serveUrl, id, browserExecutable: EDGE }));
  }
  const output = path.resolve("out/stills", `${id}-${frame}.png`);
  await renderStill({ serveUrl, composition: cache.get(id), frame, output, browserExecutable: EDGE, scale: 0.5 });
  console.log("rendered", output);
}

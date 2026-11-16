#!/usr/bin/env node
/* Per-file authoring stats — a quick self-check while writing one chunk.
   The authoritative gate is tools/check-bank.mjs; this only reports.
     node tools/file-stats.mjs ccar-f/q-d2.js                                  */
import fs from "node:fs";
import vm from "node:vm";

const file = process.argv[2];
if (!file) { console.error("usage: node tools/file-stats.mjs <question file>"); process.exit(2); }
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file });
const items = sandbox.window.CCARF_QUESTIONS || sandbox.window.CCARP_QUESTIONS || [];

const count = (arr, key) => arr.reduce((m, x) => { const k = key(x); m[k] = (m[k] || 0) + 1; return m; }, {});
const singles = items.filter((q) => q.type !== "multi");
const longestCorrect = singles.filter((q) => {
  const l = q.options.map((o) => o.length);
  return l.indexOf(Math.max(...l)) === q.correct;
}).length;
let longestHit = 0;
for (const q of items) {
  const corr = Array.isArray(q.correct) ? q.correct : [q.correct];
  const pick = q.options.map((o, i) => ({ i, n: o.length })).sort((a, b) => b.n - a.n || a.i - b.i)
    .slice(0, corr.length).map((x) => x.i);
  if (pick.every((i) => corr.includes(i))) longestHit++;
}
const ratioBad = items.filter((q) => {
  const l = q.options.map((o) => o.length);
  return Math.max(...l) / Math.min(...l) > 1.6;
}).map((q) => q.id);

console.log(`${file}: ${items.length} items`);
console.log("by skill   ", count(items, (q) => q.skill));
if (items.some((q) => q.scenario)) console.log("by scenario", count(items, (q) => `D${q.domain}-S${q.scenario}`));
console.log("kind       ", count(items, (q) => q.kind));
console.log("multi sets ", count(items.filter((q) => q.type === "multi"), (q) => [...q.correct].sort().join(",")));
console.log(`longest option correct (singles): ${singles.length ? (longestCorrect / singles.length * 100).toFixed(1) : 0}%  (aim <= 30)`);
console.log(`always-pick-longest score: ${items.length ? (longestHit / items.length * 100).toFixed(1) : 0}%`);
console.log(`length ratio > 1.6: ${ratioBad.length ? ratioBad.join(", ") : "none"}`);

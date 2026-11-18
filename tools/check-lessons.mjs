#!/usr/bin/env node
/* ============================================================================
   Lesson validator — one short, diagrammed lesson per task statement/objective.
     node tools/check-lessons.mjs --cert f|p [--strict]
   --strict also fails when a sub-skill has no lesson yet.

   LESSON SCHEMA
     id       "1.1" — the sub-skill id from blueprint.js
     tldr     one or two sentences (<= 240 chars)
     diagram  { kind, title?, caption?, ... } — kinds and their fields:
                flow      steps: [{label, sub?, tone?, edge?}] (2-5), loop?
                hub       center: {label, sub?}, spokes: [{label, sub?, tone?}] (2-6), edge?
                layers    layers: [{label, sub?, tag?, tone?}] (2-6), axis?
                compare   columns: [{title, tone?, items: [..] (1-5)}] (2-3)
                decision  question, branches: [{when, then, tone?}] (2-4)
              tone ∈ good | bad | warn | accent. Box labels <= 60 chars, subs <= 90.
     points   3-6 key points (each <= 260 chars); **bold** and `code` allowed
     table?   { head: [..], rows: [[..]] } (<= 7 rows)
     code?    short snippet (<= 14 lines)
     traps    2-4 { wrong, right }
     exam     one "in the exam" heuristic (<= 260 chars)
     sources  1-3 { label, url } — url must be in ALLOWED_SOURCES
   Whole lesson <= 520 words: it must stay a quick read.
   ============================================================================ */
import fs from "node:fs";
import vm from "node:vm";

const CERT = (process.argv.find((a) => a.startsWith("--cert=")) ?? "").slice(7) ||
  process.argv[process.argv.indexOf("--cert") + 1];
const STRICT = process.argv.includes("--strict");
const CONF = {
  f: { dir: "ccar-f", ns: "CCARF", lessons: 5 },
  p: { dir: "ccar-p", ns: "CCARP", lessons: 7 },
}[CERT];
if (!CONF) { console.error("usage: node tools/check-lessons.mjs --cert f|p [--strict]"); process.exit(2); }

/* Every URL here was checked to answer HTTP 200 on 2026-11-16. */
const ALLOWED_SOURCES = new Set([
  "https://code.claude.com/docs/en/agent-sdk/subagents", "https://code.claude.com/docs/en/sub-agents",
  "https://code.claude.com/docs/en/sessions", "https://code.claude.com/docs/en/agent-sdk/sessions",
  "https://code.claude.com/docs/en/cli-reference", "https://code.claude.com/docs/en/skills",
  "https://code.claude.com/docs/en/memory", "https://code.claude.com/docs/en/permission-modes",
  "https://code.claude.com/docs/en/mcp", "https://code.claude.com/docs/en/hooks",
  "https://code.claude.com/docs/en/agent-sdk/hooks", "https://code.claude.com/docs/en/agent-sdk/overview",
  "https://code.claude.com/docs/en/agent-sdk/permissions", "https://code.claude.com/docs/en/github-actions",
  "https://code.claude.com/docs/en/settings", "https://code.claude.com/docs/en/common-workflows",
  "https://code.claude.com/docs/en/monitoring-usage", "https://code.claude.com/docs/en/headless",
  "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
  "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools",
  "https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use",
  "https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool",
  "https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview",
  "https://platform.claude.com/docs/en/build-with-claude/batch-processing",
  "https://platform.claude.com/docs/en/build-with-claude/structured-outputs",
  "https://platform.claude.com/docs/en/build-with-claude/prompt-caching",
  "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview",
  "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/multishot-prompting",
  "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/chain-of-thought",
  "https://platform.claude.com/docs/en/build-with-claude/context-windows",
  "https://platform.claude.com/docs/en/about-claude/models/overview",
  "https://platform.claude.com/docs/en/about-claude/models/choosing-a-model",
  "https://platform.claude.com/docs/en/test-and-evaluate/define-success",
  "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests",
  "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations",
  "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks",
  "https://modelcontextprotocol.io/specification/2025-06-18/server/tools",
  "https://modelcontextprotocol.io/specification/2025-06-18/server/resources",
  "https://modelcontextprotocol.io/specification/2025-06-18/basic/transports",
  "https://www.anthropic.com/engineering/building-effective-agents",
  "https://www.anthropic.com/news/contextual-retrieval",
  "https://www.anthropic.com/engineering/multi-agent-research-system",
  "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
  "https://www.anthropic.com/engineering/writing-tools-for-agents",
  "https://a2a-protocol.org/latest/",
]);

const sandbox = { window: {} };
const files = ["blueprint", ...Array.from({ length: CONF.lessons }, (_, i) => `lessons-d${i + 1}`), "overview"];
for (const f of files) {
  const p = `${CONF.dir}/${f}.js`;
  try { vm.runInNewContext(fs.readFileSync(p, "utf8"), sandbox, { filename: p }); }
  catch (e) { console.error(`FATAL: ${p} — ${e.message}`); process.exit(1); }
}
const bp = sandbox.window[`${CONF.ns}_BLUEPRINT`];
const lessons = sandbox.window[`${CONF.ns}_LESSONS`] || [];
const subIds = bp.domains.flatMap((d) => (d.statements || d.objectives).map((s) => s.id));

const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);
const TONES = new Set(["good", "bad", "warn", "accent"]);
const str = (v) => typeof v === "string" && v.trim().length > 0;
const words = (s) => String(s).split(/\s+/).filter(Boolean).length;
const nodeCheck = (at, n, what) => {
  if (!n || !str(n.label)) return err(`${at}: ${what} without a label`);
  if (n.label.length > 60) err(`${at}: ${what} label over 60 chars ("${n.label.slice(0, 30)}…")`);
  if (n.sub && n.sub.length > 90) err(`${at}: ${what} sub over 90 chars`);
  if (n.tone && !TONES.has(n.tone)) err(`${at}: unknown tone "${n.tone}"`);
};
const range = (at, arr, lo, hi, what) => {
  if (!Array.isArray(arr) || arr.length < lo || arr.length > hi) err(`${at}: ${what} must have ${lo}-${hi} entries`);
  return Array.isArray(arr) ? arr : [];
};

const DIAG = {
  flow: (at, g) => range(at, g.steps, 2, 5, "flow.steps").forEach((s) => nodeCheck(at, s, "flow step")),
  hub: (at, g) => { nodeCheck(at, g.center, "hub center"); range(at, g.spokes, 2, 6, "hub.spokes").forEach((s) => nodeCheck(at, s, "hub spoke")); },
  layers: (at, g) => range(at, g.layers, 2, 6, "layers.layers").forEach((s) => nodeCheck(at, s, "layer")),
  compare: (at, g) => range(at, g.columns, 2, 3, "compare.columns").forEach((c) => {
    if (!str(c.title)) err(`${at}: compare column without a title`);
    if (c.tone && !TONES.has(c.tone)) err(`${at}: unknown tone "${c.tone}"`);
    range(at, c.items, 1, 5, "compare column items").forEach((x) => { if (!str(x) || x.length > 120) err(`${at}: compare item empty or over 120 chars`); });
  }),
  decision: (at, g) => {
    if (!str(g.question) || g.question.length > 120) err(`${at}: decision question missing or over 120 chars`);
    range(at, g.branches, 2, 4, "decision.branches").forEach((b) => {
      if (!str(b.when) || !str(b.then)) err(`${at}: decision branch needs when + then`);
      if ((b.then || "").length > 90 || (b.when || "").length > 90) err(`${at}: decision branch text over 90 chars`);
      if (b.tone && !TONES.has(b.tone)) err(`${at}: unknown tone "${b.tone}"`);
    });
  },
};

const seen = new Set();
const kinds = {};
for (const L of lessons) {
  const at = `lesson ${L.id}`;
  if (!subIds.includes(L.id)) err(`${at}: id is not a sub-skill of the blueprint`);
  if (seen.has(L.id)) err(`${at}: duplicate lesson`);
  seen.add(L.id);
  if (!str(L.tldr) || L.tldr.length > 240) err(`${at}: tldr missing or over 240 chars (${(L.tldr || "").length})`);
  const g = L.diagram;
  if (!g || !DIAG[g.kind]) err(`${at}: diagram missing or unknown kind "${g && g.kind}"`);
  else { DIAG[g.kind](at, g); kinds[g.kind] = (kinds[g.kind] || 0) + 1; }
  range(at, L.points, 3, 6, "points").forEach((p) => { if (!str(p) || p.length > 260) err(`${at}: a point is empty or over 260 chars`); });
  if (L.table) {
    if (!Array.isArray(L.table.head) || !Array.isArray(L.table.rows) || L.table.rows.length > 7) err(`${at}: table needs head + <= 7 rows`);
    else L.table.rows.forEach((r) => { if (r.length !== L.table.head.length) err(`${at}: table row width differs from head`); });
  }
  if (L.code && L.code.split("\n").length > 14) err(`${at}: code snippet over 14 lines`);
  range(at, L.traps, 2, 4, "traps").forEach((t) => { if (!str(t.wrong) || !str(t.right)) err(`${at}: trap needs wrong + right`); });
  if (!str(L.exam) || L.exam.length > 260) err(`${at}: exam heuristic missing or over 260 chars`);
  range(at, L.sources, 1, 3, "sources").forEach((s) => {
    if (!str(s.label)) err(`${at}: source without a label`);
    if (!ALLOWED_SOURCES.has(s.url)) err(`${at}: source URL not in the verified list: ${s.url}`);
  });
  const text = [L.tldr, ...(L.points || []), ...(L.traps || []).flatMap((t) => [t.wrong, t.right]), L.exam,
    ...((L.table && L.table.rows) || []).flat()].join(" ");
  const n = words(text);
  if (n > 520) err(`${at}: ${n} words — over the 520-word budget for a quick read`);
  L._words = n;
}
/* ==========================================================================
   Big picture (overview.js): it must introduce the WHOLE course.
   Every lesson is linked from it and every required theme is named.
   ========================================================================== */
const REQUIRED_THEMES = {
  f: ["agentic loop", "stop_reason", "end_turn", "tool_use", "tool_result", "Messages API", "harness", "Agent SDK", "Claude Code",
    "hook", "PreToolUse", "PostToolUse", "prerequisite", "handoff", "coordinator", "orchestrator", "subagent", "`Agent` tool", "fork",
    "AgentDefinition", "decomposition", "prompt chaining", "session", "--resume", "fork_session", "MCP", "isError", "resource", ".mcp.json",
    "tool_choice", "built-in", "Grep", "Glob", "CLAUDE.md", "@import", "/memory", ".claude/rules", "skill", "slash command", "context: fork",
    "allowed-tools", "plan mode", "Explore", "claude -p", "--json-schema", "few-shot", "JSON schema", "nullable", "custom_id", "batch",
    "multi-pass", "case-facts", "escalat", "scratchpad", "/compact", "manifest", "confidence", "stratified", "provenance", "interview"],
  p: ["augmented LLM", "prompt chaining", "routing", "parallelization", "orchestrator-workers", "evaluator-optimizer", "agent go/no-go",
    "Haiku", "Sonnet", "Opus", "zero-shot", "few-shot", "chain-of-thought", "prompt caching", "Skills", "RAG", "chunk", "rerank", "hybrid",
    "embeddings", "MCP", "A2A", "least privilege", "delegated", "progressive discovery", "trace", "A/B", "hallucination", "injection", "drift",
    "GDPR", "HIPAA", "FedRAMP", "bias", "fairness", "transparen", "human-in-the-loop", "ADR", "runbook", "SLA", "discovery", "handoff",
    "Claude Code", "CLAUDE.md", "hooks", "permissions", "Message Batches"],
}[CERT];
const BLOCK_TYPES = new Set(["text", "diagram", "callout", "table", "themes"]);
const DIAGRAM_KINDS = new Set([...Object.keys(DIAG), "nest", "trace"]);

function checkOverview() {
  const ov = sandbox.window[`${CONF.ns}_OVERVIEW`];
  if (!ov) { err("overview.js: no overview defined"); return; }
  for (const f of ["title", "teaser", "lead"]) if (!str(ov[f])) err(`overview: missing ${f}`);
  const secIds = new Set();
  for (const s of ov.sections || []) {
    if (secIds.has(s.id)) err(`overview: duplicate section id ${s.id}`);
    secIds.add(s.id);
    if (!str(s.nav) || !str(s.title)) err(`overview section ${s.id}: needs nav and title`);
    for (const b of s.blocks || []) {
      if (!BLOCK_TYPES.has(b.type)) err(`overview section ${s.id}: unknown block type "${b.type}"`);
      if (b.type === "diagram" && !DIAGRAM_KINDS.has(b.diagram && b.diagram.kind)) err(`overview section ${s.id}: unknown diagram kind`);
      if (b.type === "table") b.rows.forEach((r) => { if (r.length !== b.head.length) err(`overview section ${s.id}: table row width differs from head`); });
    }
  }
  const raw = JSON.stringify(ov);
  const linked = new Set([...raw.matchAll(/\{\{(\d+\.\d+)\}\}/g)].map((m) => m[1]));
  for (const m of raw.matchAll(/"id":"(\d+\.\d+)"/g)) linked.add(m[1]);
  for (const m of raw.matchAll(/"ids":\[([^\]]*)\]/g)) for (const i of m[1].matchAll(/\d+\.\d+/g)) linked.add(i[0]);
  for (const id of linked) if (!subIds.includes(id)) err(`overview: links to unknown lesson ${id}`);
  const unlinked = subIds.filter((id) => !linked.has(id));
  if (unlinked.length) err(`overview: lessons never linked: ${unlinked.join(", ")}`);
  const text = raw.toLowerCase();
  const absent = REQUIRED_THEMES.filter((t) => !text.includes(t.toLowerCase()));
  if (absent.length) err(`overview: themes never mentioned: ${absent.join(", ")}`);
  console.log(`\nBig picture — ${(ov.sections || []).length} sections · ${linked.size}/${subIds.length} lessons linked · ` +
    `${REQUIRED_THEMES.length - absent.length}/${REQUIRED_THEMES.length} required themes named`);
}
checkOverview();

const missing = subIds.filter((id) => !seen.has(id));
if (missing.length) (STRICT ? err : warn)(`no lesson yet for: ${missing.join(", ")}`);

console.log(`\nLesson check — ${CONF.dir} — ${lessons.length}/${subIds.length} lessons`);
console.log(`diagram kinds: ${JSON.stringify(kinds)}`);
if (lessons.length) {
  const w = lessons.map((l) => l._words);
  console.log(`words per lesson: min ${Math.min(...w)} · median ${w.sort((a, b) => a - b)[Math.floor(w.length / 2)]} · max ${Math.max(...w)}`);
}
if (warns.length) { console.log(`\n${warns.length} warning(s):`); warns.forEach((m) => console.log(`  ! ${m}`)); }
if (errors.length) { console.log(`\n${errors.length} error(s):`); errors.forEach((m) => console.log(`  x ${m}`)); }
if (!errors.length && !warns.length) console.log("\nClean.");
process.exit(errors.length ? 1 : 0);

#!/usr/bin/env node
/* ============================================================================
   Certification question-bank validator — dual stack.

   Copy this file into the target repo and edit ONLY the CONFIG block.
   Never edit a check body to make a bank pass.

     vanilla stack →  <repo>/tools/check-bank.mjs
     json stack    →  <repo>/scripts/check-bank.mjs   (+ "check:bank" in package.json)

     node tools/check-bank.mjs            report; exits 1 on errors only
     node tools/check-bank.mjs --strict   also fails on under-target counts

   Why .mjs and not .js: the vanilla reference repo has no package.json, so a
   CommonJS `require` works there — but a repo with "type": "module" throws
   `require is not defined`. The .mjs extension is unambiguous in both.
   `node:vm` imports fine from ESM, so the vanilla loader still works.
   ============================================================================ */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

/* ==========================================================================
   CONFIG — the only block you edit
   ========================================================================== */
/* This repo holds two certifications; pick one with --cert f|p. */
const CERT_ARG = (process.argv.find((a) => a.startsWith("--cert=")) ?? "").slice(7) ||
  process.argv[process.argv.indexOf("--cert") + 1];
const qFiles = (dir, names) => [`${dir}/blueprint.js`, ...names.map((n) => `${dir}/${n}.js`), `${dir}/data.js`];
const subs = (pairs) => Object.fromEntries(pairs);

const CERTS = {
  f: {
    files: qFiles("ccar-f", ["q-samples", "q-d1a", "q-d1b", "q-d2", "q-d3", "q-d4", "q-d5"]),
    namespace: "CCARF",
    domainTarget: { 1: 64, 2: 44, 3: 48, 4: 48, 5: 36 },
    subTarget: subs([
      ["1.1 Agentic loops", 9], ["1.2 Coordinator-subagent orchestration", 9],
      ["1.3 Subagent invocation and context passing", 10], ["1.4 Workflow enforcement and handoff", 9],
      ["1.5 Agent SDK hooks", 9], ["1.6 Task decomposition", 9], ["1.7 Session state, resumption, forking", 9],
      ["2.1 Tool interface design", 9], ["2.2 Structured MCP errors", 9], ["2.3 Tool distribution and tool_choice", 9],
      ["2.4 MCP servers in Claude Code", 9], ["2.5 Built-in tools", 8],
      ["3.1 CLAUDE.md hierarchy", 8], ["3.2 Slash commands and skills", 8], ["3.3 Path-specific rules", 8],
      ["3.4 Plan mode vs direct execution", 8], ["3.5 Iterative refinement", 8], ["3.6 Claude Code in CI/CD", 8],
      ["4.1 Explicit criteria", 8], ["4.2 Few-shot prompting", 8], ["4.3 Structured output via tool use", 8],
      ["4.4 Validation and retry loops", 8], ["4.5 Batch processing", 8], ["4.6 Multi-instance and multi-pass review", 8],
      ["5.1 Preserving critical context", 6], ["5.2 Escalation and ambiguity", 6], ["5.3 Error propagation", 6],
      ["5.4 Large codebase exploration", 6], ["5.5 Human review and confidence calibration", 6], ["5.6 Provenance and uncertainty", 6],
    ]),
    expectedAlloc: { 60: { 1: 16, 2: 11, 3: 12, 4: 12, 5: 9 }, 20: { 1: 5, 2: 4, 3: 4, 4: 4, 5: 3 } },
    /* domain × scenario authoring targets (rows = domain, cols = scenario 1..6) */
    scenarioMatrix: {
      1: [14, 6, 16, 12, 8, 8], 2: [12, 4, 12, 10, 2, 4], 3: [2, 16, 2, 10, 16, 2],
      4: [4, 6, 4, 4, 14, 16], 5: [8, 8, 8, 4, 2, 6],
    },
    scenarioPick: 4, scenarioCount: 6, scenarioExamLength: 60,
  },
  p: {
    files: qFiles("ccar-p", ["q-samples", "q-d1", "q-d2", "q-d3", "q-d4", "q-d5", "q-d6", "q-d7"]),
    namespace: "CCARP",
    domainTarget: { 1: 44, 2: 32, 3: 48, 4: 40, 5: 36, 6: 36, 7: 16 },
    subTarget: subs([
      ["1.1 Business problem to solution", 8], ["1.2 End-to-end architecture", 7], ["1.3 Architectural patterns", 8],
      ["1.4 Multi-agent design", 7], ["1.5 Decomposition", 7], ["1.6 Business value alignment", 7],
      ["2.1 Model selection", 7], ["2.2 System prompts and guardrails", 7], ["2.3 Prompting techniques", 6],
      ["2.4 Context window and tokens", 6], ["2.5 Prompt reuse", 6],
      ["3.1 Capability bloat", 6], ["3.2 AuthN/AuthZ gaps", 6], ["3.3 Accuracy-latency trade-offs", 6],
      ["3.4 Observability at scale", 6], ["3.5 RAG pipeline design", 6], ["3.6 Retrieval strategy", 6],
      ["3.7 Integration mechanism", 6], ["3.8 Progressive discovery", 6],
      ["4.1 Evaluation metrics", 7], ["4.2 Eval datasets and frameworks", 7], ["4.3 A/B testing", 7],
      ["4.4 Diagnosing issues", 7], ["4.5 Cost-performance optimization", 6], ["4.6 Monitoring", 6],
      ["5.1 Guardrails", 8], ["5.2 Risks and failure modes", 7], ["5.3 Human-in-the-loop", 7],
      ["5.4 Regulatory compliance", 7], ["5.5 Ethical AI", 7],
      ["6.1 Structured discovery", 8], ["6.2 Communicating trade-offs", 7], ["6.3 Feedback loops and SLAs", 7],
      ["6.4 Documentation and guidance", 7], ["6.5 Lifecycle phases", 7],
      ["7.1 Team tooling setup", 6], ["7.2 AI-assisted workflows", 5], ["7.3 Debugging and ops", 5],
    ]),
    expectedAlloc: { 63: { 1: 11, 2: 8, 3: 12, 4: 10, 5: 9, 6: 9, 7: 4 }, 20: { 1: 3, 2: 3, 3: 4, 4: 3, 5: 3, 6: 3, 7: 1 } },
  },
};
if (!CERTS[CERT_ARG]) { console.error("usage: node tools/check-bank.mjs --cert f|p [--strict]"); process.exit(2); }

const CONFIG = {
  stack: "vanilla",                  // 'vanilla' | 'json'

  // ---- vanilla stack -----------------------------------------------------
  files: CERTS[CERT_ARG].files,       // evaluated in order, relative to repo root
  namespace: CERTS[CERT_ARG].namespace,

  // ---- json stack --------------------------------------------------------
  contentDir: "src/content",
  certId: "sc500",

  // ---- both --------------------------------------------------------------
  /** Bank composition targets. Keys must match the referential's domain ids. */
  domainTarget: CERTS[CERT_ARG].domainTarget,
  subTarget: CERTS[CERT_ARG].subTarget,
  /** Exam lengths to assert the weighted allocation against. */
  expectedAlloc: CERTS[CERT_ARG].expectedAlloc,
  /** CCAR-F only: scenario draw feasibility (see checkScenarios). */
  scenario: CERTS[CERT_ARG].scenarioMatrix ? CERTS[CERT_ARG] : null,

  optionCounts: { single: [4, 4], multiple: [5, 5] },  // [min,max]; AZ style: [3,6] / [4,6]
  maxOptions: 8,                      // answer-letter capacity of the renderer
  lengthRatioMax: 1.6,
  longestIsCorrectMaxPct: 40,
  scenarioSharePct: [65, 75],         // set to null to skip

  /** Legacy content predates these rules: the provenance rules and the length
      rule are reported as warnings instead of errors. Never set this on new
      content — it is an amnesty for an existing backlog, not an opt-out. */
  legacy: false,
  requireSrc: true,
  requireOutdated: true,
};

/* ==========================================================================
   Loaders
   ========================================================================== */
const ROOT = process.cwd();
const STRICT = process.argv.includes("--strict");
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);
/** Provenance + length rules downgrade to warnings on legacy content. */
const rule = (m) => (CONFIG.legacy ? warn(`[legacy] ${m}`) : err(m));

/** Strips a trailing "(6.8%)" from a sub-skill label. Anchored and
    non-ambiguous so it cannot backtrack. */
const stripPct = (s) => s.replace(/\(\d+(?:\.\d+)?%\)$/, "").trimEnd();

function loadVanilla() {
  const sandbox = { window: {}, console };
  sandbox.globalThis = sandbox;
  for (const f of CONFIG.files) {
    const p = path.join(ROOT, f);
    try {
      // NOSONAR javascript:S1523 — deliberate. These are first-party files from
      // the repo being validated, evaluated in a bare sandbox with no fs, no
      // net and no process, purely to read the bank they declare on `window`.
      vm.runInNewContext(fs.readFileSync(p, "utf8"), sandbox, { filename: f });
    } catch (e) {
      console.error(`FATAL: ${f} failed to evaluate — ${e.message}`);
      process.exit(1);
    }
  }
  const ns = sandbox.window[CONFIG.namespace];
  if (!ns) { console.error(`FATAL: window.${CONFIG.namespace} is undefined`); process.exit(1); }

  const domains = ns.DOMAINS.map((d) => ({
    id: d.id,
    name: d.nom ?? d.name,
    weight: d.poids ?? d.weight,
    subs: (d.skills ?? []).map((s) => stripPct(s.nom ?? s.name)),
  }));
  const items = ns.QUESTIONS.map((q, i) => ({ ...q, _where: `${CONFIG.namespace}[${i}]` }));
  return { domains, items, caseStudies: new Map() };
}

function loadJson() {
  const dir = path.join(ROOT, CONFIG.contentDir, CONFIG.certId);
  const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
  let ref;
  try {
    ref = read(path.join(dir, "domains.json"));
  } catch (e) {
    console.error(`FATAL: cannot read ${dir}/domains.json — ${e.message}`);
    process.exit(1);
  }

  const objByDomain = {};
  for (const o of ref.objectives ?? []) {
    objByDomain[o.domainId] ??= [];
    objByDomain[o.domainId].push(o.id);
  }
  const domains = ref.domains.map((d) => ({
    id: d.id,
    name: d.name,
    // Microsoft publishes ranges; allocateByWeight normalises by the sum, so
    // the midpoint is the faithful collapse.
    weight: d.weightPercent ? (d.weightPercent.min + d.weightPercent.max) / 2 : d.weight,
    raw: d.weightPercent,
    subs: objByDomain[d.id] ?? [],
  }));

  const quizDir = path.join(dir, "quiz");
  const items = fs.readdirSync(quizDir).filter((f) => f.endsWith(".json")).flatMap((f) =>
    read(path.join(quizDir, f)).map((q, i) => ({ ...q, _file: f, _where: `${f}[${i}]` })));

  const caseStudies = new Map();
  const csPath = path.join(dir, "case-studies.json");
  if (fs.existsSync(csPath)) for (const cs of read(csPath)) caseStudies.set(cs.id, cs);

  return { domains, items, caseStudies, exam: ref.exam, objectives: ref.objectives ?? [] };
}

/* ==========================================================================
   Normaliser — both stacks collapse to one record.
   This function is itself a test: see correctIdx below.
   ========================================================================== */
/** `outdated` may be authored as a bare index or a list; absent means absent. */
function toIdxList(v) {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

function normalise(raw, ctx) {
  const isVanilla = CONFIG.stack === "vanilla";
  const objDomain = new Map((ctx.objectives ?? []).map((o) => [o.id, o.domainId]));

  return raw.map((q) => {
    const rawType = q.type ?? "single";
    const options = q.options ?? q.choices ?? null;

    let correctIdx;
    if (isVanilla) {
      correctIdx = Array.isArray(q.correct) ? q.correct.slice() : [q.correct];
    } else if (options && q.correctAnswers) {
      // The most valuable line in this file. AZ-Study-Guide keys answers by
      // literal choice STRING, so a typo, a trailing space or a curly
      // apostrophe yields a permanently ungradable item with no error message.
      // Mapping to indices turns that into a hard -1.
      correctIdx = q.correctAnswers.map((a) => options.indexOf(a));
    } else {
      correctIdx = [];
    }

    let type;
    if (rawType === "reorder") type = "order";
    else if (rawType === "active-screen") type = "fields";
    else if (isVanilla) type = rawType === "multi" ? "multiple" : "single";
    else type = correctIdx.length > 1 ? "multiple" : "single";

    return {
      id: q.id,
      groupId: isVanilla ? q.domain : objDomain.get(q.objectiveId),
      subGroupId: isVanilla ? q.skill : q.objectiveId,
      rawType, type, options, correctIdx,
      stem: q.q ?? q.prompt ?? "",
      explanation: q.expl ?? q.explanation ?? "",
      src: q.src,
      official: !!q.official,
      outdated: toIdxList(q.outdated),
      kind: q.kind,
      group: q.caseStudyId,
      scenario: q.scenario,
      reorderItems: q.reorderItems,
      fields: q.fields,
      file: q._file,
      where: q._where,
    };
  });
}

/* ==========================================================================
   Allocation — must mirror the app's implementation, tie-break included
   ========================================================================== */
function allocateByWeight(weights, total) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!sum || total <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (w / sum) * total);
  const counts = raw.map(Math.floor);
  const remainder = total - counts.reduce((a, b) => a + b, 0);
  // Explicit tie-break: without it, exact ties (SC-500's 22.5/27.5/22.5/22.5)
  // are resolved by Array.prototype.sort internals rather than a stated rule.
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r), w: weights[i] }))
    .sort((a, b) => (b.frac - a.frac) || (b.w - a.w) || (a.i - b.i));
  for (let k = 0; k < remainder; k++) counts[order[k % order.length].i] += 1;
  return counts;
}

/* ==========================================================================
   Checks
   ========================================================================== */
const CONTRAST = ["not ", "n't", "whereas", "unlike", "rather than", "fails", "tempting",
  "but ", "however", "trap", "closest miss", "misses", "cannot", "never", "instead"];
const BANNED = ["all of the above", "none of the above", "toutes les réponses",
  "aucune des réponses", "both a and b"];
const WORD_N = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

function stemCount(stem) {
  let m = /\(Select (\d+)\)/i.exec(stem);
  if (m) return +m[1];
  m = /\(Choose (\w+)\.?\)/i.exec(stem);
  if (m) return WORD_N[m[1].toLowerCase()] ?? (Number.isFinite(+m[1]) ? +m[1] : null);
  return null;
}

function checkItem(q, seen, ctx) {
  const at = q.id || q.where;

  if (!q.id) err(`${at}: missing id`);
  else if (seen.has(q.id)) err(`${at}: duplicate id`);
  else seen.add(q.id);

  if (!q.stem) err(`${at}: missing stem`);
  if (!q.explanation) err(`${at}: missing explanation`);
  if (q.groupId === undefined || !ctx.domainIds.has(q.groupId))
    err(`${at}: domain "${q.groupId}" is not declared in the referential`);
  if (q.subGroupId !== undefined && !ctx.subIds.has(q.subGroupId))
    err(`${at}: sub-group "${q.subGroupId}" is not declared in the referential`);
  if (q.file && q.subGroupId && !q.file.startsWith(q.subGroupId))
    warn(`${at}: lives in ${q.file} but declares ${q.subGroupId}`);

  /* explanation quality */
  if (q.explanation.length < 120)
    rule(`${at}: explanation is ${q.explanation.length} chars, minimum 120`);
  if (!CONTRAST.some((c) => q.explanation.toLowerCase().includes(c)))
    warn(`${at}: explanation has no contrast marker — does it say why a distractor fails?`);
  // Options are shuffled at draw time, so "(A)" points at a random option.
  if (/\(\s*[A-F]\s*\)/.test(q.explanation))
    err(`${at}: explanation references an option letter`);

  if (CONFIG.requireSrc && !q.src && !q.official) rule(`${at}: missing src`);

  if (!q.options) return;   // reorder / active-screen handled in checkTyped

  /* ---- choice-based ---- */
  // A Yes/No item (solution-goal, statement row) legitimately has two options
  // and is exempt from the option-count range.
  const isBoolean = q.options.length === 2 &&
    q.options.every((o) => /^(yes|no|true|false|on|off|oui|non)$/i.test(o.trim()));
  const [lo, hi] = CONFIG.optionCounts[q.type] ?? [2, CONFIG.maxOptions];
  if (!isBoolean && (q.options.length < lo || q.options.length > hi))
    err(`${at}: ${q.options.length} options, expected ${lo}-${hi} for ${q.type}`);
  if (q.options.length > CONFIG.maxOptions)
    err(`${at}: ${q.options.length} options exceeds the renderer's answer-letter capacity`);

  q.correctIdx.forEach((c) => {
    if (c === -1) err(`${at}: a correctAnswers entry is absent from choices — ungradable`);
    else if (!Number.isInteger(c) || c < 0 || c >= q.options.length)
      err(`${at}: correct index ${c} out of range`);
  });
  if (!q.correctIdx.length) err(`${at}: no correct answer`);
  if (new Set(q.correctIdx).size !== q.correctIdx.length) err(`${at}: duplicate correct index`);
  // Breaks React key={choice}, makes indexOf ambiguous, corrupts set comparison.
  if (new Set(q.options).size !== q.options.length) err(`${at}: duplicate choice text`);

  if (q.type === "single" && q.correctIdx.length !== 1)
    err(`${at}: single-answer with ${q.correctIdx.length} correct`);
  if (q.type === "multiple") {
    if (q.correctIdx.length < 2) err(`${at}: multiple-response with < 2 correct`);
    const n = stemCount(q.stem);
    if (n === null) err(`${at}: multiple-response stem does not state how many to select`);
    else if (n !== q.correctIdx.length)
      err(`${at}: stem says ${n} but has ${q.correctIdx.length} correct`);
  } else if (stemCount(q.stem) !== null) {
    err(`${at}: single-answer stem states a selection count`);
  }

  if (CONFIG.requireOutdated && !q.official) {
    if (q.outdated === undefined) rule(`${at}: missing outdated distractor`);
    else q.outdated.forEach((i) => {
      if (!Number.isInteger(i) || i < 0 || i >= q.options.length)
        err(`${at}: outdated index ${i} out of range`);
      if (q.correctIdx.includes(i)) err(`${at}: outdated index ${i} is also a correct answer`);
    });
  }

  q.options.forEach((o, i) => {
    if (BANNED.some((b) => o.toLowerCase().includes(b)))
      err(`${at}: option ${i} uses a banned catch-all`);
  });
  q.correctIdx.filter((c) => c >= 0).forEach((c) => {
    const o = q.options[c];
    if (/claude-[a-z]+-\d|gpt-\d|gemini-\d/i.test(o)) err(`${at}: correct option names a model ID`);
    if (/_\d{8}\b/.test(o)) err(`${at}: correct option names a dated tool-type string`);
    if (/-\d{4}-\d{2}-\d{2}\b/.test(o)) err(`${at}: correct option names a dated beta header`);
  });

  /* The tell that survives shuffling. Yes/No items are exempt — two-word
     options cannot be balanced for length and carry no such tell. */
  if (!q.official && !isBoolean) {
    const lens = q.options.map((o) => o.length);
    const ratio = Math.max(...lens) / Math.min(...lens);
    if (ratio > CONFIG.lengthRatioMax)
      rule(`${at}: option length ratio ${ratio.toFixed(2)} exceeds ${CONFIG.lengthRatioMax}` +
        ` (longest ${Math.max(...lens)}, shortest ${Math.min(...lens)})`);
  }
}

function checkTyped(items, ctx) {
  for (const q of items) {
    const at = q.id || q.where;

    if (q.rawType === "reorder") {
      const it = q.reorderItems;
      if (!Array.isArray(it) || it.length < 3) { err(`${at}: reorder needs >= 3 items`); continue; }
      if (new Set(it).size !== it.length) err(`${at}: reorder has duplicate items`);
      if (q.options) err(`${at}: reorder must not declare choices`);
      const alpha = [...it].sort((a, b) => a.localeCompare(b));
      const byLen = [...it].sort((a, b) => a.length - b.length);
      if (it.every((v, i) => v === alpha[i])) err(`${at}: reorder answer is alphabetical — free tell`);
      if (it.every((v, i) => v === byLen[i])) err(`${at}: reorder answer is length-sorted — free tell`);
    }

    if (q.rawType === "active-screen") {
      const f = q.fields;
      if (!Array.isArray(f) || f.length < 2) { err(`${at}: active-screen needs >= 2 fields`); continue; }
      if (new Set(f.map((x) => x.id)).size !== f.length) err(`${at}: duplicate field id`);
      for (const fld of f) {
        if (fld.kind === "select") {
          if (!Array.isArray(fld.options) || fld.options.length < 2)
            err(`${at}: field "${fld.id}" is a select with < 2 options`);
          else if (!fld.options.includes(fld.correctValue))
            err(`${at}: field "${fld.id}" correctValue is not among its options`);
        } else if (fld.kind === "toggle") {
          if (!["On", "Off"].includes(fld.correctValue))
            err(`${at}: field "${fld.id}" toggle correctValue must be On or Off`);
        } else err(`${at}: field "${fld.id}" has unknown kind "${fld.kind}"`);
      }
    }

    if (q.group && ctx.caseStudies.size && !ctx.caseStudies.has(q.group))
      err(`${at}: caseStudyId "${q.group}" does not resolve`);
  }

  /* solution-goal groups: exactly one Yes, and no dominant Yes-position pattern */
  const sg = new Map();
  for (const q of items) {
    if (q.rawType !== "solution-goal" || !q.group) continue;
    (sg.get(q.group) ?? sg.set(q.group, []).get(q.group)).push(q);
  }
  const patterns = new Map();
  for (const [gid, group] of sg) {
    if (group.length < 3) warn(`${gid}: solution-goal group has only ${group.length} items`);
    const yes = group.filter((q) => q.options && /^yes$/i.test(q.options[q.correctIdx[0]] ?? ""));
    if (yes.length !== 1) err(`${gid}: solution-goal group has ${yes.length} Yes answers, expected 1`);
    const key = group.map((q) => (q.options?.[q.correctIdx[0]] ?? "?")).join(",");
    patterns.set(key, (patterns.get(key) ?? 0) + 1);
  }
  if (sg.size >= 5) {
    for (const [key, n] of patterns) {
      if (n / sg.size > 0.6)
        err(`solution-goal answer pattern [${key}] used by ${n}/${sg.size} groups — a learnable tell`);
    }
  }

  /* case studies must amortise their scenario */
  const csCount = new Map();
  for (const q of items) if (q.group?.startsWith("cs-")) csCount.set(q.group, (csCount.get(q.group) ?? 0) + 1);
  for (const [id, n] of csCount)
    if (n < 4) warn(`${id}: only ${n} questions against this case study — scenario cost not amortised`);
}

/* ==========================================================================
   Aggregate
   ========================================================================== */
function aggregate(items, ctx) {
  const out = [];
  const say = (s) => out.push(s);

  /* composition */
  say("\nComposition by domain");
  const byDomain = {};
  for (const q of items) byDomain[q.groupId] = (byDomain[q.groupId] ?? 0) + 1;
  const targets = Object.keys(CONFIG.domainTarget);
  for (const d of (targets.length ? targets : Object.keys(byDomain))) {
    const have = byDomain[d] ?? 0;
    const want = CONFIG.domainTarget[d];
    if (want === undefined) { say(`  ${d}  ${String(have).padStart(4)}`); continue; }
    if (have > want) err(`domain ${d}: ${have} items exceeds the target of ${want}`);
    else if (have < want && STRICT) err(`domain ${d}: ${have}/${want} items`);
    let flag = "ok";
    if (have < want) flag = "TODO";
    else if (have > want) flag = "OVER";
    say(`  ${d}  ${String(have).padStart(4)}/${String(want).padEnd(4)} ${flag}`);
  }
  const bySub = {};
  for (const q of items) bySub[q.subGroupId] = (bySub[q.subGroupId] ?? 0) + 1;
  for (const [s, want] of Object.entries(CONFIG.subTarget)) {
    const have = bySub[s] ?? 0;
    if (have > want) err(`sub-group "${s}": ${have} exceeds target ${want}`);
    else if (have < want && STRICT) err(`sub-group "${s}": ${have}/${want}`);
    // Informational: a very small sub-skill is legitimate when the blueprint
    // weight is tiny, but a targeted quiz over it will be thin.
    if (have < 8) warn(`sub-group "${s}": ${have} items — a targeted quiz over it will be thin`);
  }

  /* weights + allocation */
  const weights = ctx.domains.map((d) => d.weight);
  const wSum = +weights.reduce((a, b) => a + b, 0).toFixed(4);
  if (ctx.domains[0]?.raw) {
    const lo = ctx.domains.reduce((a, d) => a + d.raw.min, 0);
    const hi = ctx.domains.reduce((a, d) => a + d.raw.max, 0);
    say(`\nPublished weight ranges sum to ${lo}-${hi} (midpoints ${wSum}) — normalised by the allocator, not a defect`);
    if (lo > 100 || hi < 100) warn(`published ranges ${lo}-${hi} do not bracket 100`);
  } else if (wSum !== 100) {
    err(`domain weights sum to ${wSum}, expected 100`);
  }

  for (const [n, want] of Object.entries(CONFIG.expectedAlloc)) {
    const got = allocateByWeight(weights, +n);
    if (got.reduce((a, b) => a + b, 0) !== +n) err(`allocation for n=${n} does not sum to ${n}`);
    ctx.domains.forEach((d, i) => {
      if (want[d.id] !== undefined && got[i] !== want[d.id])
        err(`allocation n=${n}: ${d.id} got ${got[i]}, expected ${want[d.id]}`);
    });
    const shape = ctx.domains.map((d, i) => d.id + ":" + got[i]).join(" ");
    say(`  n=${n} → ${shape}`);
    // Freshness is what pool headroom is actually for, so measure that directly
    // rather than asserting a headroom multiple. For a domain, the chance a
    // drawn item repeats next time is allocation/pool; weight by allocation.
    let expOverlap = 0;
    ctx.domains.forEach((d, i) => {
      const pool = byDomain[d.id] ?? 0;
      if (pool < got[i]) err(`domain ${d.id}: pool of ${pool} cannot fill its n=${n} allocation of ${got[i]}`);
      else if (pool > 0) expOverlap += (got[i] * got[i]) / pool;
    });
    const pctOverlap = (expOverlap / +n) * 100;
    say(`       expected overlap between two consecutive n=${n} exams: ${pctOverlap.toFixed(0)}%`);
    if (pctOverlap > 50)
      warn(`two consecutive n=${n} exams would share ~${pctOverlap.toFixed(0)}% of their items — pools too thin`);
  }
  const a1 = allocateByWeight(weights, 20).join(",");
  for (let k = 0; k < 200; k++)
    if (allocateByWeight(weights, 20).join(",") !== a1) { err("allocation is not deterministic"); break; }

  /* the tells */
  const choice = items.filter((q) => q.options && q.correctIdx.every((c) => c >= 0));
  const singles = choice.filter((q) => q.type === "single" && !q.official);
  if (singles.length >= 20) {
    const hist = [0, 0, 0, 0, 0, 0, 0, 0];
    for (const q of singles) if (q.correctIdx[0] < 8) hist[q.correctIdx[0]]++;
    say("\nAuthored correct-answer position (runtime shuffles anyway)");
    hist.slice(0, Math.max(...singles.map((q) => q.options.length))).forEach((n, i) =>
      say(`  index ${i}  ${String(n).padStart(4)}  ${(n / singles.length * 100).toFixed(1).padStart(5)}%`));

    const longestCorrect = singles.filter((q) => {
      const lens = q.options.map((o) => o.length);
      return lens.indexOf(Math.max(...lens)) === q.correctIdx[0];
    }).length;
    const pct = (longestCorrect / singles.length) * 100;
    say(`  longest option is the correct one: ${pct.toFixed(1)}% (target <= ${CONFIG.longestIsCorrectMaxPct}%)`);
    if (pct > CONFIG.longestIsCorrectMaxPct)
      rule(`the longest option is correct on ${pct.toFixed(1)}% of single-answer items`);
  }

  /* headline: what a candidate scores knowing nothing */
  if (choice.length >= 20) {
    let hit = 0;
    for (const q of choice) {
      const n = q.correctIdx.length;
      const pick = q.options
        .map((o, i) => ({ i, len: o.length }))
        .sort((a, b) => b.len - a.len || a.i - b.i)
        .slice(0, n).map((x) => x.i);
      if (pick.length === n && pick.every((i) => q.correctIdx.includes(i))) hit++;
    }
    const score = (hit / choice.length) * 100;
    say(`\n  ALWAYS-PICK-THE-LONGEST SCORE: ${hit}/${choice.length} = ${score.toFixed(1)}%`);
    say("  (a candidate who reads nothing; compare against the exam's raw pass threshold)");
    if (score > 45) rule(`always-pick-the-longest scores ${score.toFixed(1)}% — the bank leaks its answers`);
  }

  /* multi patterns */
  const multis = items.filter((q) => q.type === "multiple");
  if (multis.length) {
    const pat = new Map();
    for (const q of multis) {
      const s = [...q.correctIdx].sort((a, b) => a - b);
      pat.set(s.join(","), (pat.get(s.join(",")) ?? 0) + 1);
      if (s.every((v, i) => v === i)) warn(`${q.id}: correct set is a leading prefix`);
    }
    say(`\nMultiple-response: ${multis.length} items (${(multis.length / items.length * 100).toFixed(1)}% of bank)`);
    for (const [k, n] of pat) if (n > 2) warn(`multi correct-set pattern [${k}] used ${n} times (max 2)`);
  }

  /* scenario/recall mix */
  if (CONFIG.scenarioSharePct && items.some((q) => q.kind)) {
    const s = items.filter((q) => q.kind === "scenario").length;
    const r = (s / items.length) * 100;
    say(`\nScenario/recall mix: ${r.toFixed(0)}/${(100 - r).toFixed(0)}`);
    const [minS, maxS] = CONFIG.scenarioSharePct;
    if (r < minS || r > maxS) warn(`scenario share ${r.toFixed(0)}% outside ${minS}-${maxS}%`);
  }

  /* near-duplicate stems */
  const STOP = new Set("a an the of to in on for and or is are that which with what when it its this these those be as by at from you your".split(" "));
  const toks = items.map((q) => new Set(q.stem.toLowerCase().replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w))));
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      const inter = [...toks[i]].filter((w) => toks[j].has(w)).length;
      const union = new Set([...toks[i], ...toks[j]]).size;
      if (union && inter / union > 0.6)
        warn(`near-duplicate stems: ${items[i].id} / ${items[j].id} (Jaccard ${(inter / union).toFixed(2)})`);
    }

  /* runtime shuffle fairness */
  const probe = singles[0];
  if (probe) {
    const N = 4000, hist = new Array(probe.options.length).fill(0);
    for (let k = 0; k < N; k++) {
      const o = probe.options.map((_, i) => i);
      for (let i = o.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [o[i], o[j]] = [o[j], o[i]];
      }
      hist[o.indexOf(probe.correctIdx[0])]++;
    }
    const ideal = 1 / probe.options.length;
    const dev = Math.max(...hist.map((n) => Math.abs(n / N - ideal)));
    say(`\nRuntime shuffle over ${N} draws: ${hist.map((n) => (n / N * 100).toFixed(1) + "%").join("  ")}`);
    if (dev > 0.03) err(`shuffle is not uniform — max deviation ${(dev * 100).toFixed(1)} points`);
  }

  /* official samples: measured, never enforced */
  const officials = items.filter((q) => q.official && q.options);
  if (officials.length) {
    say(`\nOfficial samples (verbatim, exempt from the length rule) — ${officials.length}`);
    for (const q of officials) {
      const lens = q.options.map((o) => o.length);
      say(`  ${String(q.id).padEnd(16)} ratio ${(Math.max(...lens) / Math.min(...lens)).toFixed(2)}` +
        `  longest is correct: ${lens.indexOf(Math.max(...lens)) === q.correctIdx[0] ? "yes" : "no"}`);
    }
  }

  return out;
}


/* ==========================================================================
   Scenario feasibility (added for CCAR-F; a new check, not a modified one).
   The app picks `scenarioPick` of `scenarioCount` scenarios per mock exam and
   draws each domain's allocation from those scenarios only. Every
   combination must be able to fill a full-length exam, or the draw falls
   back to other scenarios.
   ========================================================================== */
function checkScenarios(items, ctx) {
  const sc = CONFIG.scenario;
  if (!sc) return [];
  const out = ["\nScenario coverage (domain x scenario, have/target)"];
  const ids = Array.from({ length: sc.scenarioCount }, (_, i) => i + 1);
  for (const q of items) {
    if (!ids.includes(q.scenario)) err(`${q.id}: scenario "${q.scenario}" is not 1..${sc.scenarioCount}`);
  }
  const cell = (d, s) => items.filter((q) => q.groupId === d && q.scenario === s).length;
  out.push("        " + ids.map((s) => ("S" + s).padStart(8)).join(""));
  for (const d of ctx.domains) {
    const want = sc.scenarioMatrix[d.id] || [];
    out.push(`  D${d.id}    ` + ids.map((s, i) => `${cell(d.id, s)}/${want[i] ?? "-"}`.padStart(8)).join(""));
    ids.forEach((s, i) => { if (want[i] !== undefined && cell(d.id, s) > want[i]) warn(`D${d.id} x S${s}: ${cell(d.id, s)} exceeds target ${want[i]}`); });
  }
  out.push("  total " + ids.map((s) => String(items.filter((q) => q.scenario === s).length).padStart(8)).join(""));
  const alloc = allocateByWeight(ctx.domains.map((d) => d.weight), sc.scenarioExamLength);
  const combos = [];
  const rec = (start, acc) => {
    if (acc.length === sc.scenarioPick) { combos.push(acc.slice()); return; }
    for (let i = start; i < ids.length; i++) { acc.push(ids[i]); rec(i + 1, acc); acc.pop(); }
  };
  rec(0, []);
  let short = 0;
  for (const c of combos) {
    ctx.domains.forEach((d, i) => {
      const pool = items.filter((q) => q.groupId === d.id && c.includes(q.scenario)).length;
      if (pool < alloc[i]) {
        short++;
        (STRICT ? err : warn)(`scenarios {${c.join(",")}}: D${d.id} pool ${pool} < allocation ${alloc[i]} at n=${sc.scenarioExamLength}`);
      }
    });
  }
  out.push(`  ${combos.length} combinations of ${sc.scenarioPick}/${sc.scenarioCount} checked at n=${sc.scenarioExamLength}: ${short ? short + " domain shortfall(s)" : "all feasible"}`);
  return out;
}

/* ==========================================================================
   Length tells against chance (added; a new check). Over-correcting the
   length rule makes the correct answer the SHORTEST option, which a reader
   who knows nothing exploits just as well. Both strategies are scored the
   way the runtime experiences them: options are shuffled, so equal lengths
   are broken at random (expected value), not by authored position. Each
   score must stay within TELL_MARGIN points of blind guessing.
   ========================================================================== */
const TELL_MARGIN = 3;
const comb = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1); return r; };

/** Probability that picking the k shortest (dir=1) or longest (dir=-1)
    options, ties broken at random, selects exactly the correct set. */
function pickProbability(q, dir) {
  const k = q.correctIdx.length;
  const lens = q.options.map((o) => o.length);
  const v = [...lens].sort((a, b) => dir * (a - b))[k - 1];      // boundary length
  const before = lens.map((l, i) => i).filter((i) => dir * (lens[i] - v) < 0);
  const tied = lens.map((l, i) => i).filter((i) => lens[i] === v);
  if (!before.every((i) => q.correctIdx.includes(i))) return 0;
  const need = k - before.length;
  const tiedCorrect = tied.filter((i) => q.correctIdx.includes(i)).length;
  if (tiedCorrect < need) return 0;
  return comb(tiedCorrect, need) / comb(tied.length, need);
}

function checkLengthTells(items) {
  const choice = items.filter((q) => q.options && q.correctIdx.every((c) => c >= 0));
  if (choice.length < 20) return [];
  let chance = 0, shortest = 0, longest = 0;
  for (const q of choice) {
    chance += 1 / comb(q.options.length, q.correctIdx.length);
    shortest += pickProbability(q, 1);
    longest += pickProbability(q, -1);
  }
  const pct = (x) => (x / choice.length) * 100;
  const out = ["\nLength tells vs blind guessing (ties broken at random, as after the runtime shuffle)",
    `  blind guessing          ${pct(chance).toFixed(1)}%`,
    `  always pick the longest ${pct(longest).toFixed(1)}%`,
    `  always pick the shortest ${pct(shortest).toFixed(1)}%`];
  for (const [name, v] of [["longest", longest], ["shortest", shortest]]) {
    if (pct(v) > pct(chance) + TELL_MARGIN)
      rule(`always-pick-the-${name} scores ${pct(v).toFixed(1)}%, more than ${TELL_MARGIN} points above blind guessing (${pct(chance).toFixed(1)}%)`);
  }
  return out;
}

/* ==========================================================================
   Run
   ========================================================================== */
const loaded = CONFIG.stack === "vanilla" ? loadVanilla() : loadJson();
const items = normalise(loaded.items, loaded);
const ctx = {
  domains: loaded.domains,
  caseStudies: loaded.caseStudies,
  objectives: loaded.objectives ?? [],
  domainIds: new Set(loaded.domains.map((d) => d.id)),
  subIds: new Set(loaded.domains.flatMap((d) => d.subs)),
};

console.log(`\nBank check — ${CONFIG.stack} stack` +
  (CONFIG.stack === "json" ? ` · ${CONFIG.certId}` : "") +
  ` — ${items.length} items${CONFIG.legacy ? " · LEGACY amnesty active" : ""}`);
console.log("=".repeat(70));

const seen = new Set();
for (const q of items) checkItem(q, seen, ctx);
checkTyped(items, ctx);
console.log(aggregate(items, ctx).join("\n"));
console.log(checkLengthTells(items).join("\n"));
console.log(checkScenarios(items, ctx).join("\n"));

console.log(`\n${"=".repeat(70)}`);
if (warns.length) { console.log(`\n${warns.length} warning(s):`); warns.forEach((w) => console.log(`  ! ${w}`)); }
if (errors.length) { console.log(`\n${errors.length} error(s):`); errors.forEach((e) => console.log(`  x ${e}`)); }
if (!warns.length && !errors.length) console.log("\nClean.");
if (CONFIG.legacy) console.log("\nLEGACY amnesty was active: provenance and length rules were downgraded to warnings.");
console.log("");
process.exit(errors.length ? 1 : 0);

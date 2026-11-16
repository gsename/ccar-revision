/* ============================================================================
   CCAR-F revision data — Claude Certified Architect – Foundations
   Source: public Exam Guide v1.0 (July 2026) + Anthropic documentation.
   Verbatim guide content lives in blueprint.js (frozen). This file holds what
   we authored: exam facts, domain summaries, takeaways, flashcards.
   Load order (index.html): blueprint.js → q-*.js → data.js → ../shared/app.js
   Field names nom/poids/couleur/resume/cles/recto/verso are kept from the
   CCDV-F app the shared engine was generalised from.
   ============================================================================ */
(function () {
  const BP = window.CCARF_BLUEPRINT;

  const EXAM_INFO = {
    titre: "Claude Certified Architect – Foundations",
    code: "CCAR-F",
    version: "Exam Guide v1.0 · Effective July 2026",
    items: 60,
    minutes: 120,
    examLengths: [20, 60],
    scenariosPerExam: 4,
    pass: 720, scaleMin: 100, scaleMax: 1000, echelle: "100 – 1000",
    format: "Multiple-choice and multiple-response items; each item states how many responses to select",
    structure: "The exam presents 4 scenarios picked at random from a bank of 6; each scenario frames a set of questions.",
    livraison: "Proctored — online and/or Pearson VUE test centre",
    prix: "125 USD",
    validite: "12 months from the date awarded",
    reussite: "Pass/fail plus a scaled score (100–1,000), with percent-correct per domain — informational only",
    notation: "Criterion-referenced against a fixed standard from a formal standard-setting study; scaled scoring equates exam forms",
    retake: "Wait 14 days after a 1st failure, 30 after a 2nd, 90 after a 3rd — max 4 attempts per rolling 12 months",
    renouvellement: "Free unproctored assessment if renewed on time; otherwise re-sit the full exam at full fee",
    audience: "Solution architects with 6+ months building on the Claude API, Agent SDK, Claude Code and MCP",
    subLabel: "task statement", subLabelPlural: "Task statements",
    lsKey: "ccar_f_state_v1",
  };

  /* Authored per-domain summary and takeaways, keyed by domain id. */
  const AUTHORED = {
    1: {
      couleur: "#C9622E",
      resume: "How an agent loop runs, how a coordinator splits work across subagents, and where a guarantee must be enforced in code rather than requested in a prompt. The recurring decision is deterministic versus probabilistic control: anything with financial or identity consequences belongs in a hook or a prerequisite gate.",
      cles: [
        "Loop on `stop_reason`: continue while it is `tool_use`, stop on `end_turn`. Never stop because the text says DONE, and never make an iteration cap the primary stop — a cap is only a safety net.",
        "Append the assistant turn and every `tool_result` back to the history before the next call; the API is stateless.",
        "Subagents start with a fresh context: pass findings, sources and goals explicitly in their prompt. (Fork subagents are the exception — they inherit the conversation.)",
        "The subagent-spawning tool is `Agent` in current docs, formerly `Task` (the guide's name; still accepted as an alias). The coordinator needs it in `allowedTools`.",
        "Parallel subagents = several Agent/Task calls in one coordinator response, not one per turn.",
        "Hub-and-spoke: all subagent traffic goes through the coordinator — observability, consistent error handling, controlled information flow.",
        "If coverage is wrong, look at the coordinator's decomposition first: subagents faithfully research only what they are assigned.",
        "Prompt instructions have a non-zero failure rate. Use a programmatic prerequisite or a PreToolUse hook when the rule must always hold (identity before refund, refund ceiling).",
        "PostToolUse hooks normalise heterogeneous tool output (timestamps, status codes) before the model reads it.",
        "Prompt chaining for predictable multi-step reviews; dynamic decomposition for open-ended investigation.",
        "Resume a session when its context is still valid and tell it what changed; start fresh with a structured summary when tool results are stale. Fork to compare two approaches from one baseline.",
      ],
    },
    2: {
      couleur: "#B0472B",
      resume: "Designing the tools an agent chooses between, the errors they return, and who gets which tool. The tool description is the model's primary selection signal, and a structured error is what lets the agent decide between retry, rephrase, explain or escalate.",
      cles: [
        "Tool descriptions drive selection: state purpose, inputs and formats, example queries, edge cases, and when to use it instead of a similar tool.",
        "Overlapping tools misroute: rename and re-describe them, or split a generic tool into purpose-specific ones with clear contracts.",
        "Check the system prompt too — a keyword-heavy instruction can override a good tool description.",
        "MCP tool failures come back as a result with `isError: true` plus content the agent can reason about.",
        "Return `errorCategory` (transient / validation / business / permission), `isRetryable` and a readable message. A generic 'Operation failed' blocks recovery.",
        "An empty result is a successful query with no matches — never report a timeout as an empty result.",
        "Fewer tools per agent = more reliable selection (4–5 beats 18). Give each subagent only its role's tools, plus a narrow cross-role tool for a frequent need.",
        "`tool_choice`: `auto` may answer in text · `any` must call some tool · `{type:\"tool\",name}` must call that one. Forced choice is rejected with manual extended thinking and on the newest models.",
        "`.mcp.json` (project, committed) for team servers with `${VAR}` expansion for secrets; `~/.claude.json` (user) for personal ones. All configured servers' tools are available together.",
        "MCP resources expose catalogs (schemas, doc trees, issue lists) so the agent does not need exploratory calls.",
        "Grep searches contents, Glob matches paths, Edit needs a unique anchor — fall back to Read + Write when it isn't unique.",
      ],
    },
    3: {
      couleur: "#8A6D3B",
      resume: "Configuring Claude Code for a team: where instructions live so the right people get them, how conventions load only when relevant, when to plan before editing, and how to run it unattended in CI. Most questions are 'which file, which scope, which flag'.",
      cles: [
        "`~/.claude/CLAUDE.md` is personal and never shared; team instructions go in the project's `CLAUDE.md` or `.claude/CLAUDE.md`, committed. Subdirectory CLAUDE.md files load when Claude works there.",
        "`@path` imports keep CLAUDE.md modular (max 4 hops); `.claude/rules/*.md` splits a monolithic file by topic.",
        "A rule with `paths:` globs loads only when Claude touches a matching file — the right tool for conventions spread across directories (`**/*.test.tsx`).",
        "`/memory` shows which memory files are loaded — the first check when behaviour differs between people or sessions.",
        "Team commands/skills: `.claude/commands/` or `.claude/skills/` in the repo. Personal: under `~/.claude/`. Commands have been merged into skills; both locations still work.",
        "Skill frontmatter: `context: fork` isolates verbose output in a subagent; `allowed-tools` restricts tools; `argument-hint` prompts for parameters.",
        "Skills load on demand; CLAUDE.md is always loaded — universal standards in CLAUDE.md, task workflows in skills.",
        "Plan mode for architectural, multi-file, multi-approach work; direct execution for a clear, scoped fix. Plan, then execute.",
        "The Explore subagent keeps verbose discovery out of the main context and returns a summary.",
        "CI: `claude -p` (non-interactive), `--output-format json`, `--json-schema` for machine-parseable findings. CLAUDE.md supplies review criteria and fixtures to CI runs.",
        "Review with an independent instance, not the session that wrote the code. On re-runs, pass prior findings and report only new or unresolved issues.",
        "Iterate with 2–3 concrete input/output examples, tests written first, or the interview pattern; send interacting issues together, independent ones one by one.",
      ],
    },
    4: {
      couleur: "#6B8068",
      resume: "Making output precise and consistent: explicit criteria instead of 'be careful', examples instead of more prose, schemas for shape and validation for meaning, and the right API for the latency budget. Most traps are instructions that sound rigorous but change nothing.",
      cles: [
        "'Be conservative' and 'only high-confidence findings' do not raise precision. Write categorical criteria: what to report, what to skip.",
        "A noisy category erodes trust in the accurate ones — disable it temporarily while you fix its prompt.",
        "Few-shot (2–4 targeted examples, with the reasoning for the choice) is the strongest lever for consistent format and ambiguous-case handling.",
        "Tool use with a JSON schema (or structured outputs) guarantees syntax, not semantics: totals can still fail to add up.",
        "Make fields nullable when the source may lack them — required fields push the model to invent values. Add `unclear` and `other` + detail to enums.",
        "Retry with the document, the failed output and the specific validation error. Retries fix format errors, not information that is absent from the source.",
        "Extract `calculated_total` next to `stated_total`, flag `conflict_detected`; add `detected_pattern` to findings to analyse dismissals.",
        "Message Batches: 50% cheaper, up to 24 h, no latency SLA, no mid-request tool calls, match results by `custom_id`. Overnight yes, pre-merge no.",
        "Resubmit only the failed `custom_id`s, fixed (e.g. chunked). Refine the prompt on a sample before a large batch.",
        "Self-review in the same session is weak; use an independent instance. Split big reviews into per-file passes plus a cross-file integration pass.",
      ],
    },
    5: {
      couleur: "#5E6E8C",
      resume: "Keeping the right facts in context over long sessions, escalating for the right reasons, propagating errors with enough detail to recover, and keeping provenance through synthesis. The recurring trap is a proxy signal — sentiment, self-confidence, aggregate accuracy — standing in for the real one.",
      cles: [
        "Summaries blur numbers, dates and promises: keep a persistent 'case facts' block outside the summarised history.",
        "Trim verbose tool output to the fields that matter before it accumulates in context.",
        "Lost in the middle: put key findings first and use clear section headers in long aggregated inputs.",
        "Escalate on: explicit request for a human (immediately), policy gap or exception, no meaningful progress. Not on sentiment or self-rated confidence.",
        "Several customers match? Ask for another identifier — never pick by heuristic.",
        "Subagents retry transient failures locally and propagate only what they cannot fix, with failure type, query, partial results and alternatives.",
        "Suppressing an error as an empty success and killing the whole workflow on one failure are both anti-patterns.",
        "Annotate synthesis with coverage: which findings are well supported and which areas have gaps.",
        "Long exploration degrades context: use scratchpad files, subagents for focused questions, phase summaries, `/compact`, and state manifests for crash recovery.",
        "97% overall can hide a failing document type: measure accuracy by type and field, sample high-confidence output with stratified sampling, calibrate thresholds on labelled data.",
        "Keep claim → source mappings (URL, document, excerpt, date) through every hop. Show conflicting credible values side by side with attribution; dates explain many apparent contradictions.",
      ],
    },
  };

  const DOMAINS = BP.domains.map((d) => ({
    id: d.id, nom: d.nom, poids: d.poids,
    couleur: AUTHORED[d.id].couleur,
    resume: AUTHORED[d.id].resume,
    cles: AUTHORED[d.id].cles,
    skills: d.statements.map((s) => ({
      nom: `${s.id} ${s.short}`,
      desc: s.title,
      official: { knowledge: s.knowledge, skills: s.skills },
    })),
  }));

  const FLASHCARDS = [
    { domain: 1, recto: "When does an agentic loop stop?", verso: "When `stop_reason` is `end_turn`. Continue while it is `tool_use`. Text content, the word DONE or an iteration cap are not the stopping signal (a cap is a backstop only)." },
    { domain: 1, recto: "Do subagents see the coordinator's conversation?", verso: "No — a standard subagent starts fresh. Pass findings and goals in its prompt. Only fork subagents inherit the conversation." },
    { domain: 1, recto: "Subagent-spawning tool name", verso: "`Agent` in current docs; the exam guide calls it `Task` (still accepted as an alias). It must be in the coordinator's `allowedTools`." },
    { domain: 1, recto: "How to run subagents in parallel", verso: "Emit several Agent/Task tool calls in a single coordinator response." },
    { domain: 1, recto: "Prompt rule vs hook", verso: "A prompt rule is probabilistic. A hook or prerequisite gate is executed by code — use it when the rule must always hold (identity before refund, $500 ceiling)." },
    { domain: 1, recto: "PostToolUse hook — typical use", verso: "Normalise tool output before the model sees it: Unix timestamps vs ISO 8601, numeric status codes → labels." },
    { domain: 1, recto: "Resume or start fresh?", verso: "Resume when prior context is mostly valid (tell it which files changed). Start fresh with a structured summary when tool results are stale. Fork to explore two approaches from one baseline." },
    { domain: 1, recto: "Prompt chaining vs dynamic decomposition", verso: "Chaining: fixed, predictable steps (per-file pass then integration pass). Dynamic: open-ended investigation where subtasks depend on what is discovered." },
    { domain: 2, recto: "What does a model use to choose a tool?", verso: "Mainly the tool description. Include purpose, input formats, example queries, edge cases, and when to use it versus similar tools." },
    { domain: 2, recto: "Structured tool error fields", verso: "`errorCategory` (transient / validation / business / permission), `isRetryable`, a readable message — returned with MCP `isError: true`." },
    { domain: 2, recto: "Timeout vs empty result", verso: "A timeout is an access failure (retry decision). Zero matches is a successful query. Never report one as the other." },
    { domain: 2, recto: "tool_choice options", verso: "`auto` — may reply in text · `any` — must call some tool · `{type:\"tool\",name}` — must call that tool · `none`." },
    { domain: 2, recto: "Project vs user MCP config", verso: "Project: `.mcp.json` in the repo, shared, `${VAR}` for secrets. User: `~/.claude.json`, personal/experimental." },
    { domain: 2, recto: "MCP resources — why", verso: "Expose a catalog (schemas, docs, issue summaries) so the agent sees what exists without exploratory tool calls." },
    { domain: 2, recto: "Grep vs Glob", verso: "Grep searches file contents (callers, error messages). Glob matches file paths (`**/*.test.tsx`)." },
    { domain: 3, recto: "Instruction not reaching a new teammate?", verso: "It is probably in `~/.claude/CLAUDE.md` (personal). Move it to the project CLAUDE.md, committed. Check with `/memory`." },
    { domain: 3, recto: "Conventions for test files spread everywhere", verso: "`.claude/rules/testing.md` with `paths: [\"**/*.test.tsx\"]` — loads only when matching files are touched." },
    { domain: 3, recto: "Skill frontmatter you must know", verso: "`context: fork` (isolated subagent), `allowed-tools` (restrict tools), `argument-hint` (prompt for parameters)." },
    { domain: 3, recto: "Skill or CLAUDE.md?", verso: "CLAUDE.md: always loaded, universal standards. Skill: loaded on demand, task-specific workflow." },
    { domain: 3, recto: "Plan mode or direct execution?", verso: "Plan mode for architecture, many files, several valid approaches. Direct for a clear, scoped change such as a single-file bug fix." },
    { domain: 3, recto: "Claude Code in CI", verso: "`claude -p \"…\"` (non-interactive) + `--output-format json` + `--json-schema` for structured findings." },
    { domain: 3, recto: "Why not let the generating session review its code?", verso: "It keeps its own reasoning and is less likely to question it. Use an independent instance." },
    { domain: 4, recto: "Precision lever that does NOT work", verso: "'Be conservative' / 'only report high-confidence findings'. Use explicit categorical criteria instead." },
    { domain: 4, recto: "How many few-shot examples, and what kind?", verso: "2–4 targeted examples of the ambiguous cases, showing why one choice beats the plausible alternative." },
    { domain: 4, recto: "What a JSON schema does not guarantee", verso: "Semantic correctness — items not summing to the total, values in the wrong field. Validate separately." },
    { domain: 4, recto: "Preventing fabricated fields", verso: "Make fields optional/nullable when the source may not contain them; add `unclear` / `other` + detail to enums." },
    { domain: 4, recto: "When a retry will not help", verso: "When the information is absent from the source (e.g. it is in a document not provided). Retries fix format and structure errors." },
    { domain: 4, recto: "Message Batches API in one line", verso: "50% cheaper, up to 24 h, no latency SLA, no mid-request tool calls, results matched by `custom_id`." },
    { domain: 4, recto: "Batch SLA arithmetic", verso: "Guarantee = submission interval + 24 h processing. A 30 h SLA needs a batch at least every 6 h (the guide uses 4 h windows for margin)." },
    { domain: 5, recto: "Case facts block", verso: "Amounts, dates, order IDs, statuses kept verbatim in every prompt, outside the summarised history, so summarisation cannot blur them." },
    { domain: 5, recto: "Lost in the middle — mitigation", verso: "Put a key-findings summary at the start; organise the details under explicit section headers." },
    { domain: 5, recto: "Valid escalation triggers", verso: "Customer asks for a human (honour immediately) · policy gap or exception · no meaningful progress. Not sentiment, not self-rated confidence." },
    { domain: 5, recto: "Multiple customer matches", verso: "Ask for an additional identifier. Never pick by heuristic." },
    { domain: 5, recto: "Error context a subagent should propagate", verso: "Failure type, what was attempted, partial results, possible alternatives — after local retries of transient failures." },
    { domain: 5, recto: "97% overall accuracy — safe to automate?", verso: "Not yet: check accuracy by document type and field; keep stratified sampling of high-confidence output." },
    { domain: 5, recto: "Two credible sources disagree", verso: "Keep both values with attribution (and dates); let the coordinator reconcile. Never pick one silently." },
  ];

  window.CERT = {
    EXAM_INFO,
    DOMAINS,
    SCENARIOS: BP.scenarios,
    QUESTIONS: window.CCARF_QUESTIONS || [],
    FLASHCARDS,
    PREP: BP.prep,
  };
  /* Namespace read by tools/check-bank.mjs. */
  window.CCARF = window.CERT;
})();

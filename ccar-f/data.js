/* ============================================================================
   CCAR-F revision data — Claude Certified Architect – Foundations
   Source: public Exam Guide v1.0 (July 2026) + Anthropic documentation.
   Verbatim guide content lives in blueprint.js (frozen). This file holds what
   we authored: exam facts, domain summaries, takeaways. Lessons: lessons-d*.js.
   Load order (index.html): blueprint.js → q-*.js → lessons-*.js → data.js → ../shared/app.js
   Field names nom/poids/couleur/resume/cles are kept from the
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

  window.CERT = {
    EXAM_INFO,
    DOMAINS,
    SCENARIOS: BP.scenarios,
    QUESTIONS: window.CCARF_QUESTIONS || [],
    LESSONS: window.CCARF_LESSONS || [],
    OVERVIEW: window.CCARF_OVERVIEW || null,
    PREP: BP.prep,
  };
  /* Namespace read by tools/check-bank.mjs. */
  window.CCARF = window.CERT;
})();

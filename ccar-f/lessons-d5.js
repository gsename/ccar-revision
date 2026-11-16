/* ============================================================================
   CCAR-F lessons — Domain 5: Context Management & Reliability
   One short lesson per task statement. Written from tools/facts.md and the
   public Exam Guide v1.0. Schema: see tools/check-lessons.mjs.
   ============================================================================ */
window.CCARF_LESSONS = window.CCARF_LESSONS || [];
window.CCARF_LESSONS.push(
  {
    id: "5.1",
    tldr: "Long conversations lose exact facts to summaries and to the middle of the window. Pin transactional facts in a case-facts block, trim tool output early, and put key findings first.",
    diagram: {
      kind: "layers",
      title: "Prompt layout for a long session",
      layers: [
        { label: "Case facts block", sub: "order IDs, $84.37, dates, statuses, what the customer was promised", tag: "never summarized", tone: "good" },
        { label: "Summarized older history", sub: "gist of earlier turns — lossy by design" },
        { label: "Recent turns + trimmed tool results", sub: "only the 5 relevant fields of a 40-field lookup", tone: "accent" },
      ],
      caption: "Every request still resends the full message history: the API is stateless.",
    },
    points: [
      "**Progressive summarization** turns $84.37 into \"around $80\" and drops dates and stated expectations. Extract them into a persistent **case facts** block outside the summary; one entry per issue in multi-issue sessions.",
      "**Lost in the middle**: models use the start and end of a long input reliably, the middle less. Put a **key-findings summary first** and split detail under explicit **section headers**.",
      "**Tool results accumulate**: trim each output to the fields the task needs before it enters context (e.g. in the tool or a `PostToolUse` hook).",
      "**Statelessness**: if the app does not resend the conversation, the model answers \"the second order?\" as if the chat just started.",
      "Upstream agents feeding a tight downstream budget should return **structured data** (key facts, citations, relevance, dates, source locations), not verbose text and reasoning chains.",
    ],
    traps: [
      { wrong: "A larger context window fixes the omitted middle findings.", right: "Position effects persist; reorder (summary first) and structure with headers." },
      { wrong: "Summarize more aggressively to save tokens.", right: "Summarize narrative, but keep exact transactional facts verbatim in their own block." },
    ],
    exam: "Exact numbers drifting → case-facts block. Context bloated by lookups → trim fields at the source. Middle sources ignored → key findings first plus headers.",
    sources: [
      { label: "Effective context engineering", url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" },
      { label: "Context windows", url: "https://platform.claude.com/docs/en/build-with-claude/context-windows" },
    ],
  },
  {
    id: "5.2",
    tldr: "Escalate on explicit criteria — the customer asks for a human, policy is silent or needs an exception, or no progress is possible — not on sentiment or the model's own confidence. Ambiguous matches → ask.",
    diagram: {
      kind: "decision",
      title: "Escalate, resolve, or ask?",
      question: "What does the conversation show?",
      branches: [
        { when: "Customer explicitly asks for a human", then: "Hand off immediately — no investigation first", tone: "warn" },
        { when: "Policy is silent or needs an exception", then: "Escalate (e.g. competitor price match, policy covers own site only)", tone: "warn" },
        { when: "Frustrated, but the fix is within tools and policy", then: "Acknowledge, offer to resolve; escalate if they ask again", tone: "good" },
        { when: "Lookup returns several matching customers", then: "Ask for another identifier — never pick one", tone: "accent" },
      ],
    },
    points: [
      "Write **explicit escalation criteria** in the system prompt, with **few-shot examples** of escalate vs resolve cases.",
      "Valid triggers: a **request for a human**, a **policy gap or exception**, and **inability to make progress**. \"Complex\" alone is not a trigger.",
      "**Sentiment scores** and **self-reported confidence** are poor proxies for complexity: angry customers often have simple issues, and the model is confidently wrong.",
      "**Multiple matches** (three customers or three `UserService` classes) call for clarification, not a heuristic like \"most recent\".",
    ],
    traps: [
      { wrong: "Resolve first, then transfer — the issue only takes one tool call.", right: "An explicit request for a human is honoured immediately." },
      { wrong: "Escalate when sentiment drops below a threshold or confidence is under 80%.", right: "Use categorical criteria; these signals do not track case difficulty." },
      { wrong: "Policy does not forbid competitor matching, so approve it.", right: "Silence is a gap: escalate rather than invent policy." },
    ],
    exam: "Choose explicit, categorical criteria. Options built on sentiment, self-rated confidence or \"pick the likeliest match\" are distractors.",
    sources: [
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
      { label: "Prompt engineering overview", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview" },
    ],
  },
  {
    id: "5.3",
    tldr: "Subagents fix what they can locally and report the rest as structured errors — type, what was tried, partial results, alternatives — so the coordinator can recover and the report can show its gaps.",
    diagram: {
      kind: "compare",
      title: "When a source fails",
      columns: [
        {
          title: "Suppress",
          tone: "bad",
          items: ["Return `[]` as success", "Report says \"no evidence exists\"", "Coordinator never learns of the outage"],
        },
        {
          title: "Abort",
          tone: "bad",
          items: ["One timeout kills the whole workflow", "All partial results are lost"],
        },
        {
          title: "Propagate structured",
          tone: "good",
          items: [
            "Retry transient errors locally first",
            "Then send: failure type, query attempted, partial results, alternatives",
            "Report carries coverage annotations",
          ],
        },
      ],
    },
    points: [
      "**Access failure ≠ empty result**. A timeout needs a retry decision; \"0 matches\" is a valid finding. Conflating them produces false negatives (\"no security issues found\" after a scanner timeout).",
      "A generic status like \"search unavailable\" hides what the coordinator needs: **what failed, what was attempted, what was partially found, what else could work**.",
      "**Local recovery**: transient blips are retried inside the subagent; only unresolvable errors travel up, so the coordinator does not re-run whole tasks.",
      "**Coverage annotations** in the synthesis mark which findings are well-supported and which areas have gaps because sources were unavailable — the report can still ship.",
    ],
    traps: [
      { wrong: "Return empty results on failure to keep the pipeline running.", right: "Keep running, but flag the failure explicitly with its context." },
      { wrong: "Stop the workflow on any subagent error to stay safe.", right: "Continue with partial results and let the coordinator decide." },
    ],
    exam: "The right option keeps the workflow alive AND makes the failure visible with context. Silent success and full abort are both anti-patterns.",
    sources: [
      { label: "Multi-agent research system", url: "https://www.anthropic.com/engineering/multi-agent-research-system" },
      { label: "Implement tool use (errors)", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use" },
    ],
  },
  {
    id: "5.4",
    tldr: "In long explorations, context degrades. Keep the main agent as coordinator, push verbose digging into subagents, persist findings in scratchpad files and manifests, and `/compact` when the window fills.",
    diagram: {
      kind: "hub",
      title: "Main agent keeps the big picture",
      center: { label: "Main agent", sub: "high-level map + phase summaries only" },
      spokes: [
        { label: "Explore subagents", sub: "\"find all test files\", \"trace refund flow\" → return a summary", tone: "good" },
        { label: "Scratchpad file", sub: "key findings, re-read for later questions", tone: "accent" },
        { label: "State manifest", sub: "each agent exports state; coordinator loads it on resume", tone: "accent" },
        { label: "`/compact [focus]`", sub: "summarize history, keep the session going" },
      ],
    },
    points: [
      "**Degradation symptom**: inconsistent answers and \"typical patterns\" instead of the specific class found earlier (`LedgerRepository`).",
      "**Subagents** (via the `Agent` tool, formerly `Task`) isolate noisy Grep and trace output; only their summaries reach the main context.",
      "Between phases, **summarize findings** and inject that summary into each new subagent's prompt — subagents start with fresh context.",
      "**Crash recovery**: each agent writes structured state to a known location; on restart the coordinator reads the **manifest** and skips finished work.",
      "**Resuming** a session whose files changed since gives stale tool results: tell the agent what changed, or start fresh from the scratchpad summary.",
    ],
    traps: [
      { wrong: "Answers drift → keep going; the context window is big enough.", right: "Refresh from the scratchpad, `/compact`, or restart with a summary." },
      { wrong: "Subagents see the main conversation, so no need to brief them.", right: "Default subagents get only their prompt — pass the phase summary explicitly." },
    ],
    exam: "Verbose output → subagent or `/compact`. Forgotten findings → scratchpad. Redone work after a crash → manifest. Stale resumed session → fresh start with a summary.",
    sources: [
      { label: "Claude Code subagents", url: "https://code.claude.com/docs/en/sub-agents" },
      { label: "Effective context engineering", url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" },
      { label: "Sessions", url: "https://code.claude.com/docs/en/sessions" },
    ],
  },
  {
    id: "5.5",
    tldr: "Overall accuracy hides weak segments. Validate per document type and field, route by calibrated field-level confidence, and keep measuring auto-approved output with stratified random sampling.",
    diagram: {
      kind: "decision",
      title: "Where does an extraction go?",
      question: "Has this segment been validated, and how confident is the field?",
      branches: [
        { when: "Document type or field not validated yet", then: "Keep full human review for that segment", tone: "warn" },
        { when: "Low calibrated confidence, or sources contradict", then: "Human review — spend scarce reviewer capacity here", tone: "accent" },
        { when: "High confidence in a validated segment", then: "Auto-approve + stratified random sample for QA", tone: "good" },
      ],
    },
    points: [
      "**97% overall** can mean 99% on common invoices and 70% on rare customs forms. Measure accuracy **by document type and by field** before reducing review.",
      "Have the model emit **field-level confidence**, then **calibrate thresholds** on a labeled validation set — raw scores are not probabilities.",
      "Set stricter thresholds for **costly fields** (tax IDs) than cheap ones.",
      "**Stratified random sampling** of high-confidence output covers rare segments a simple random sample would almost never draw, and surfaces **novel error patterns**.",
    ],
    traps: [
      { wrong: "Overall accuracy beats the target → remove human review everywhere.", right: "Remove it only for segments that meet the target individually." },
      { wrong: "Trust the model's self-reported confidence as-is.", right: "Calibrate it against labeled data before routing on it." },
      { wrong: "Once auto-approved, stop sampling.", right: "Keep sampling: error rates drift and new patterns appear." },
    ],
    exam: "Look for segment-level validation, calibrated thresholds and stratified sampling. Any option justified only by an aggregate number is a trap.",
    sources: [
      { label: "Define success criteria", url: "https://platform.claude.com/docs/en/test-and-evaluate/define-success" },
      { label: "Develop tests", url: "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests" },
    ],
  },
  {
    id: "5.6",
    tldr: "Keep every claim tied to its source and date through each summarization step. Annotate conflicts instead of picking a value, and separate established findings from contested ones.",
    diagram: {
      kind: "flow",
      title: "Provenance survives the pipeline",
      steps: [
        { label: "Subagent output", sub: "claim + source URL/doc + excerpt + publication date", tone: "accent", edge: "structured" },
        { label: "Coordinator", sub: "conflicts kept and annotated, not resolved silently", edge: "merged mappings" },
        { label: "Synthesis report", sub: "established vs contested sections, citations intact", tone: "good" },
      ],
      caption: "Free-text summaries between steps are where attribution disappears.",
    },
    points: [
      "**Claim-source mappings** (source, document name, excerpt) must be required from subagents and **preserved and merged** by synthesis; compressing to prose drops them.",
      "**Conflicting statistics** from credible sources: include both values with attribution and let the coordinator decide — never choose one arbitrarily or average them.",
      "**Dates** on every finding: a 2019 and a 2024 survey differ because time passed, not because they contradict.",
      "Report structure: **well-established** vs **contested** findings, keeping each source's own characterization and methodology.",
      "**Render by content type**: financial figures as tables, news as prose, technical findings as structured lists.",
    ],
    traps: [
      { wrong: "Pick the most recent or most authoritative value when sources disagree.", right: "Report both with sources (and dates); flag the conflict for the coordinator." },
      { wrong: "Normalize every section into the same bullet format.", right: "Match the format to the content type." },
    ],
    exam: "Choose options that keep source, excerpt and date attached to each claim and that surface conflicts. Silent resolution, averaging and uniform formatting are distractors.",
    sources: [
      { label: "Multi-agent research system", url: "https://www.anthropic.com/engineering/multi-agent-research-system" },
      { label: "Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations" },
    ],
  },
);

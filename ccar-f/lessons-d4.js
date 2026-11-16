/* ============================================================================
   CCAR-F lessons — Domain 4: Prompt Engineering & Structured Output
   One short lesson per task statement. Written from tools/facts.md and the
   public Exam Guide v1.0. Schema: see tools/check-lessons.mjs.
   ============================================================================ */
window.CCARF_LESSONS = window.CCARF_LESSONS || [];
window.CCARF_LESSONS.push(
  {
    id: "4.1",
    tldr: "Precision comes from categorical criteria — exactly what to report and what to skip — not from asking the model to \"be conservative\". False positives in one category destroy trust in all of them.",
    diagram: {
      kind: "compare",
      title: "Same goal, two prompts",
      columns: [
        { title: "Vague", tone: "bad", items: [
          "\"Check that comments are accurate\"",
          "\"Be conservative\" / \"only high-confidence findings\"",
          "\"Rate severity sensibly\"",
        ] },
        { title: "Explicit criteria", tone: "good", items: [
          "\"Flag a comment only when its claimed behaviour contradicts the code\"",
          "Report: bugs, security. Skip: minor style, the team's local patterns",
          "Critical = example A, major = example B, minor = example C",
        ] },
      ],
      caption: "The model cannot calibrate \"conservative\"; it can apply a rule.",
    },
    points: [
      "**Explicit criteria** define the boundary of a finding. A vague goal leaves the model to guess, so it over-reports.",
      "**Confidence-based filtering** (\"only report if sure\") does not reliably raise precision; the model's sense of certainty is not your definition of an issue.",
      "**Trust is shared**: when one noisy category is wrong 60% of the time, developers start dismissing every comment, real security findings included.",
      "Temporarily **disable** a high false-positive category to restore trust, improve its prompt offline, then re-enable it.",
      "**Severity** stays consistent only with defined levels, each illustrated by a concrete code example.",
    ],
    traps: [
      { wrong: "Add \"be conservative, only high-confidence issues\" to cut noise.", right: "Replace it with explicit report/skip categories." },
      { wrong: "Keep every category on while tuning the noisy one.", right: "Turn the noisy category off first; its noise is costing trust in the accurate ones." },
      { wrong: "Use ALL-CAPS \"CRITICAL: YOU MUST\" emphasis for important rules.", right: "A calm, specific instruction works better than shouting." },
    ],
    exam: "Pick the option that states concrete conditions or examples. Words like \"conservative\", \"careful\", \"high-confidence\" or \"sensible\" mark the distractor.",
    sources: [
      { label: "Prompt engineering overview", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview" },
      { label: "Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations" },
    ],
  },
  {
    id: "4.2",
    tldr: "When detailed instructions still give inconsistent output, add 2–4 targeted examples. Examples fix format, show how to handle ambiguous cases, and let the model generalise judgment to cases no rule mentions.",
    diagram: {
      kind: "hub",
      title: "What few-shot examples fix",
      center: { label: "2–4 targeted examples", sub: "chosen for the cases that go wrong" },
      spokes: [
        { label: "Output format", sub: "location, issue, severity, suggested fix — every time", tone: "good" },
        { label: "Ambiguous cases", sub: "show why action A beats plausible action B", tone: "accent" },
        { label: "Acceptable vs genuine issue", sub: "the team's intentional pattern vs the real bug", tone: "good" },
        { label: "Varied document structures", sub: "inline citations vs bibliography; terms in an annex", tone: "good" },
      ],
    },
    points: [
      "**Few-shot examples** are the most effective lever for consistent, actionable output when a format paragraph is being followed loosely.",
      "Make examples **targeted**: the ambiguous request, the borderline branch-coverage gap, the near-miss pattern. Include the **reasoning** for why one option was chosen over the alternatives.",
      "Examples teach **judgment that generalises**: twelve rules miss novel cases; a few well-chosen examples let the model infer the principle.",
      "Pair an acceptable pattern with a genuine issue (logged-and-handled exception vs swallowed exception) to cut false positives without losing true ones.",
      "In extraction, examples drawn from the **varied formats** that fail (informal measurements, terms buried in an annex, inline citations) reduce empty fields and hallucinated values.",
    ],
    traps: [
      { wrong: "Add more rules to the list to cover the missed cases.", right: "Rules only cover what you foresaw; examples let the model generalise." },
      { wrong: "Use many examples that all look alike.", right: "Use 2–4 diverse examples aimed at the failure cases." },
      { wrong: "Show only the right answer.", right: "Show the reasoning for rejecting the plausible alternative too." },
    ],
    exam: "When the symptom is inconsistency, missed variants or empty fields on differently structured documents, the answer adds a few targeted examples — not longer instructions or a bigger model.",
    sources: [
      { label: "Multishot prompting", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/multishot-prompting" },
    ],
  },
  {
    id: "4.3",
    tldr: "Define the output as a JSON schema — a tool's `input_schema` or `output_config.format` — and syntax errors disappear. Semantic errors do not: valid JSON can still hold wrong values.",
    diagram: {
      kind: "decision",
      title: "Which `tool_choice`?",
      question: "What must the response contain?",
      branches: [
        { when: "`auto` (default)", then: "Model may reply in text instead — no guarantee", tone: "bad" },
        { when: "`any`", then: "Must call a tool, picks which: several schemas, unknown doc type", tone: "good" },
        { when: "`{\"type\": \"tool\", \"name\": ...}`", then: "Must call that one: e.g. metadata first, before enrichment", tone: "good" },
        { when: "`none`", then: "No tool calls at all", tone: "accent" },
      ],
      caption: "Forced choice is rejected with manual extended thinking and on the newest tiers; there, use `output_config.format` or a `strict` tool.",
    },
    points: [
      "**Tool use with a JSON schema**: define an extraction tool, then read structured data from the `tool_use` block's `input`. The exam guide teaches this route.",
      "Current docs prefer **`output_config.format`** (`json_schema`) or **`strict: true`** on a tool: constrained decoding guarantees valid JSON, declared types and required fields.",
      "**Required vs optional**: if the source may lack a value, make the field optional/nullable. A required field pushes the model to fabricate one.",
      "**Extensible enums**: add `\"other\"` plus a detail string for new categories, and `\"unclear\"` for genuinely ambiguous cases.",
      "**Semantics stay your job**: line items may not sum to the total; a value can land in the wrong field. Validate after parsing.",
      "Put **normalisation rules** (date format, units) in the prompt alongside the schema; the schema fixes structure, not formatting conventions inside strings.",
    ],
    traps: [
      { wrong: "Ask for JSON in the prompt and regex-parse it, or prefill `{`.", right: "Use a schema: a tool or `output_config.format`." },
      { wrong: "A strict schema means validation can be deleted.", right: "It removes syntax errors only; business-rule checks remain." },
      { wrong: "Mark every field required to make output complete.", right: "Required fields with no source value invite invented data." },
    ],
    exam: "Unset `tool_choice` + occasional text replies → set `any` or force the tool. Invented values → make the field nullable. Valid JSON but wrong numbers → semantic validation, not a stricter schema.",
    sources: [
      { label: "Structured outputs", url: "https://platform.claude.com/docs/en/build-with-claude/structured-outputs" },
      { label: "Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools" },
    ],
  },
  {
    id: "4.4",
    tldr: "Validate every extraction, then retry with the specific errors appended. Retries fix format and structure mistakes; they cannot conjure information the document does not contain.",
    diagram: {
      kind: "decision",
      title: "Validation failed — what now?",
      question: "Why did it fail?",
      branches: [
        { when: "Format or structure (date style, field shape)", then: "Retry: document + failed output + exact errors", tone: "good" },
        { when: "Value absent from the source (\"see attached\")", then: "Do not retry: return null, flag for a human", tone: "bad" },
        { when: "Source itself inconsistent (items ≠ total)", then: "Record both values, set `conflict_detected`", tone: "warn" },
      ],
    },
    points: [
      "**Retry with error feedback**: the follow-up includes the original document, the failed extraction and the specific validation errors — not just \"try again\".",
      "**Limits of retry**: if the data lives in an external document that was not provided, every retry fails or invents. Detect it and route the case instead.",
      "**Semantic vs syntax errors**: schemas (tool use, `output_config.format`) eliminate syntax errors; semantic ones — values that do not sum, a value in the wrong field — need your validator.",
      "**Self-correction fields**: extract `calculated_total` alongside `stated_total`, and a `conflict_detected` boolean, so discrepancies in the source document surface instead of being silently \"fixed\".",
      "**Feedback loops**: add a `detected_pattern` field to each finding; when developers dismiss findings, you can see which code constructs cause false positives and fix the prompt systematically.",
    ],
    traps: [
      { wrong: "Retry up to five times with the same prompt.", right: "Append the specific errors; identical retries repeat identical mistakes." },
      { wrong: "Keep retrying when a required value is missing from the source.", right: "Missing information is not a model error; make the field nullable and escalate." },
      { wrong: "Let the model correct the total so it matches the line items.", right: "Capture both totals and flag the conflict; the document may be wrong." },
    ],
    exam: "First classify the failure: fixable format/structure → retry with errors; information absent → no retry. For \"can't tell why findings are dismissed\", add `detected_pattern`.",
    sources: [
      { label: "Structured outputs", url: "https://platform.claude.com/docs/en/build-with-claude/structured-outputs" },
      { label: "Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations" },
    ],
  },
  {
    id: "4.5",
    tldr: "The Message Batches API halves the price but may take up to 24 hours with no latency guarantee. Use it for work nobody waits on; keep blocking checks on the synchronous API.",
    diagram: {
      kind: "compare",
      title: "Synchronous API vs Message Batches",
      columns: [
        { title: "Synchronous Messages API", items: [
          "Someone is waiting: pre-merge checks, chat",
          "Multi-turn tool loops",
          "Full price",
        ] },
        { title: "Message Batches API", items: [
          "Overnight reports, weekly audits, nightly test generation",
          "50% price, most done < 1 h, expires at 24 h, no SLA",
          "One single-turn request each; match results by `custom_id`",
        ] },
      ],
    },
    points: [
      "**Latency decides**: a pre-merge check blocks a developer, so it stays synchronous even though batch is cheaper.",
      "**No mid-request tool execution**: a batch request cannot call a tool, receive the result and continue. A write-test → run-tests → fix loop does not fit.",
      "Results come back in **any order**: correlate them with your `custom_id` per request.",
      "**Failures**: resubmit only the failed `custom_id`s, adapted to the cause (e.g. chunk documents that exceeded the context window). Never resend the whole batch.",
      "**SLA arithmetic**: worst case = submission interval + 24 h. A 30 h promise needs submissions at most every 6 h; the guide's example uses 4 h windows for margin.",
      "**Refine on a sample first**: tune the prompt on a small set synchronously, then batch the full volume, to avoid paying for resubmissions. Limits: 100,000 requests or 256 MB per batch; results kept 29 days.",
    ],
    traps: [
      { wrong: "Batch everything to save 50%, including pre-merge checks.", right: "Batch has no latency guarantee; blocking work stays synchronous." },
      { wrong: "Match results to inputs by position.", right: "Order is not preserved; use `custom_id`." },
      { wrong: "Batches allow 10,000 requests, keep results 7 days, or finish within 1 h.", right: "100,000 requests or 256 MB, 29-day results, up to 24 h." },
    ],
    exam: "Ask \"is anyone blocked waiting?\" and \"does the request need tool round-trips?\" A yes to either rules out batch. For SLA questions, add 24 h to the submission interval.",
    sources: [
      { label: "Batch processing", url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing" },
    ],
  },
  {
    id: "4.6",
    tldr: "A model reviewing its own work in the same session inherits its own reasoning and misses its own mistakes. Review with an independent instance, and split large reviews into per-file passes plus an integration pass.",
    diagram: {
      kind: "flow",
      title: "Multi-pass review of a large change",
      steps: [
        { label: "Generator session", sub: "writes the code; its reasoning stays here", edge: "diff only" },
        { label: "Per-file passes", sub: "independent instance, local issues, one file at a time", tone: "good", edge: "findings" },
        { label: "Integration pass", sub: "cross-file data flow, interfaces, contradictions", tone: "good", edge: "+ confidence" },
        { label: "Route findings", sub: "high confidence → post; low → human check", tone: "accent" },
      ],
    },
    points: [
      "**Self-review limitation**: the generating session keeps the context that justified its choices, so it rarely questions them. \"Now review your work\" in the same conversation is weak.",
      "An **independent instance** without the generator's reasoning catches more subtle issues than self-review instructions or extended thinking in the same session.",
      "**Attention dilution**: one pass over many files gives shallow, sometimes contradictory findings. A bigger context window does not fix this; focused passes do.",
      "**Per-file passes** find local bugs; a separate **integration pass** checks cross-file data flow that no single-file pass can see.",
      "A **verification pass** where each finding carries a self-reported confidence enables routing: post confident findings, send uncertain ones for human review. Calibrate the threshold against real outcomes.",
    ],
    traps: [
      { wrong: "Ask the same conversation to double-check its fix.", right: "Start a fresh instance that sees only the code and the requirements." },
      { wrong: "Review all 30 files in one prompt using a larger context window.", right: "Split into per-file passes plus an integration pass." },
      { wrong: "Enable extended thinking so the generator reviews itself better.", right: "More reasoning in the same context keeps the same blind spots." },
    ],
    exam: "Pick the option that changes who reviews (a separate instance) or how the review is split (per-file + integration). Options that only add instructions or context size are distractors.",
    sources: [
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
      { label: "Multi-agent research system", url: "https://www.anthropic.com/engineering/multi-agent-research-system" },
    ],
  },
);

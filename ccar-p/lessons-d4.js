/* ============================================================================
   CCAR-P lessons — Domain 4: Evaluation, Testing & Optimization
   One short lesson per objective. Written from tools/facts.md and the public
   Exam Guide v1.0. Schema: see tools/check-lessons.mjs.
   ============================================================================ */
window.CCARP_LESSONS = window.CCARP_LESSONS || [];
window.CCARP_LESSONS.push(
  {
    id: "4.1",
    tldr: "Turn \"accurate and fast\" into measurable criteria before any prompt exists: accuracy on a labelled set, p95 latency, cost per completed task, and separate safety and security rates with hard release thresholds.",
    diagram: {
      kind: "compare",
      title: "Vague goal vs measurable criteria",
      columns: [
        { title: "Unfalsifiable", tone: "bad", items: [
          "\"It feels accurate\" after reviewing twenty outputs",
          "Mean latency on the dashboard",
          "Cost per API call",
          "One blended score: 80% accuracy, 20% safety",
        ] },
        { title: "Decision-ready", tone: "good", items: [
          "Accuracy on a labelled set, with a go/no-go threshold",
          "p95 (and p50) end-to-end latency per request",
          "Total tokens per resolved task, retries and tool loops included",
          "Violation rate on an adversarial set, gating release on its own",
        ] },
      ],
      caption: "Each metric needs a number and a threshold agreed with the business before the pilot starts.",
    },
    points: [
      "Good criteria are **specific, measurable, achievable, relevant**. Write them first: they are what makes a go/no-go decision possible.",
      "**Latency**: users feel the tail. Write SLAs against **p95**; a healthy mean can hide the slow answers people complain about.",
      "**Cost** is per business outcome (per resolved claim), summing every call, retry and tool loop. Cheaper calls can still mean a dearer task.",
      "**Safety and security** are separate metrics with **hard thresholds**: e.g. rate of unauthorised actions triggered by injected text. Never let an accuracy gain buy back a safety regression.",
      "Pick the cheapest reliable **grader** per metric: code-based exact match where an answer key exists, an LLM judge (human-calibrated) for open-ended quality.",
    ],
    traps: [
      { wrong: "Track refusal rate alone as the safety metric.", right: "Refusal rate rewards over-refusing. Measure violations on an adversarial set, and keep helpfulness tracked too." },
      { wrong: "Use the largest model so quality is not a variable, and pick metrics after the pilot.", right: "Without metrics up front there is nothing to decide against; tier choice is itself something to evaluate." },
    ],
    exam: "Prefer the option that names a specific metric with a threshold (p95, per-task cost, violation rate). Reject averages, single blended scores and \"review a few outputs\".",
    sources: [
      { label: "Define your success criteria", url: "https://platform.claude.com/docs/en/test-and-evaluate/define-success" },
      { label: "Create strong empirical evaluations", url: "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests" },
    ],
  },
  {
    id: "4.2",
    tldr: "An eval set is a versioned product: representative real cases stratified by segment, plus edge, adversarial and incident cases, with a held-out split. Grade each output with the cheapest method that is reliable for it.",
    diagram: {
      kind: "layers",
      title: "What goes into an evaluation dataset",
      layers: [
        { label: "Held-out test split", sub: "Never tuned against; checks that gains generalise", tag: "guards overfit", tone: "accent" },
        { label: "Regression cases from incidents", sub: "Every production failure becomes a permanent test", tone: "warn" },
        { label: "Adversarial cases", sub: "Injection, policy probes, abuse", tone: "warn" },
        { label: "Edge cases", sub: "Missing fields, ambiguous inputs, rare formats", tone: "warn" },
        { label: "Representative real traffic", sub: "Stratified by channel, type, language: a minimum per segment", tag: "base", tone: "good" },
      ],
      caption: "Version the whole set and score every release against the same pinned version.",
    },
    points: [
      "**Stratify**: a 10% segment needs a minimum case count of its own, or its score rests on a handful of examples.",
      "**Version and pin** the dataset. If cases change between runs, a score drop cannot be attributed to the release.",
      "Forty prompt iterations on the same 300 cases **overfits** them. Keep a held-out split you only score, never tune on.",
      "**Mixed methods**: code-based checks for structure and exact answers, an LLM judge with an explicit rubric for prose, humans as the gold standard on a sample.",
      "A judge is only as good as its **agreement with humans**. Low agreement: sharpen the rubric into explicit criteria with examples, then re-measure on labelled cases.",
    ],
    table: {
      head: ["Grader", "Best for", "Watch out"],
      rows: [
        ["Code-based", "Schema valid, exact match, totals, unit tests", "Only where an answer key exists"],
        ["LLM-as-judge", "Faithfulness, tone, reasoning quality at scale", "Calibrate on human labels; avoid self-judging"],
        ["Human", "Gold labels, calibration, high-stakes spot checks", "Slow, costly, limited capacity"],
      ],
    },
    traps: [
      { wrong: "Use an LLM judge for everything, including whether the JSON parses.", right: "Use code where a deterministic check exists: faster, cheaper and exact." },
      { wrong: "The judge disagrees with experts, so switch to human grading only.", right: "Fix the rubric and re-measure agreement; keep automation for scale." },
    ],
    exam: "Look for stratification, a held-out split, versioning and incident regression cases. Match each grader to what it can check reliably.",
    sources: [
      { label: "Create strong empirical evaluations", url: "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests" },
    ],
  },
  {
    id: "4.3",
    tldr: "Change one thing at a time, prove it offline on the pinned eval set, then expose a small online slice with a primary metric, guard metrics and a sample size fixed in advance. A breached guard or segment vetoes the gain.",
    diagram: {
      kind: "flow",
      title: "One controlled improvement cycle",
      steps: [
        { label: "Isolate one change", sub: "Prompt OR model tier, not both", edge: "pre-register" },
        { label: "Fix metrics up front", sub: "Primary + guards with thresholds, minimum effect, sample size", edge: "offline" },
        { label: "Offline eval", sub: "Pinned dataset, compliance and segment cases, repeated runs", edge: "pass" },
        { label: "Small online slice", sub: "e.g. 5% of traffic, guards watched live", tone: "accent" },
        { label: "Ship or hold", sub: "Guards and segments must hold, not just the average", tone: "good" },
      ],
      loop: "Feed findings back as new cases and the next single change",
    },
    points: [
      "**One variable per experiment**. A new prompt plus a tier change in one variant leaves a drop unattributable.",
      "**Guard metrics** are things that must not degrade while you push the primary: p95 latency, safety-violation rate, compliance flags.",
      "**Variance**: outputs differ run to run. A 3-point gap on 30 cases inside a 74–81% control spread is noise; add cases or repeat runs.",
      "**Segments**: a significant overall gain can hide a regression in one pre-defined segment. That regression blocks rollout until fixed and re-tested.",
    ],
    traps: [
      { wrong: "The primary metric rose 4 points, so ship even though a guard metric breached.", right: "A guard breach vetoes the gain: hold the variant and diagnose." },
      { wrong: "Decide the success metric after seeing the results.", right: "Metrics, thresholds, minimum effect and sample size are fixed before the test starts." },
    ],
    exam: "Trustworthy answers isolate a single change, go offline before online, pre-define metrics and sample size, and let guards or segment regressions block release.",
    sources: [
      { label: "Create strong empirical evaluations", url: "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests" },
      { label: "Define your success criteria", url: "https://platform.claude.com/docs/en/test-and-evaluate/define-success" },
    ],
  },
  {
    id: "4.4",
    tldr: "Read the shape of the errors before changing anything: consistent on one input pattern points to the prompt, unsupported claims to grounding, a hard step failing on a small tier to model mismatch.",
    diagram: {
      kind: "decision",
      title: "What does the error pattern say?",
      question: "Where and how do the failures occur?",
      branches: [
        { when: "Reproducible on one input pattern", then: "Prompt failure: add the missing instruction + examples", tone: "good" },
        { when: "Fluent claims absent from the sources", then: "Hallucination: check retrieval, then ground and cite", tone: "warn" },
        { when: "One hard step fails, easy steps pass", then: "Model mismatch: route that step to a stronger tier", tone: "accent" },
        { when: "Truncated output, `stop_reason: max_tokens`", then: "Config limit: raise the cap or split the input", tone: "warn" },
      ],
      caption: "Logs first: retrieved context, stop_reason and prompt version tell you which branch you are on.",
    },
    points: [
      "**Prompt failure**: day/month swapped on every French invoice means the prompt never stated the convention. Fix instructions and examples, not the model.",
      "**Hallucination**: first check whether the right passage was retrieved. If not, it is a retrieval problem; if yes, require quoted sources and allow \"not stated\".",
      "**Model mismatch** runs both ways: a tier too weak for a reasoning step, or Opus spent on simple look-ups. Route per step instead of swapping everything.",
      "Not every error is the model: `stop_reason: \"max_tokens\"` on exactly the failing cases is a configuration limit.",
    ],
    traps: [
      { wrong: "Upgrade the whole pipeline to the top tier when one step underperforms.", right: "Move only the failing complex step; keep the cheap tier where it meets targets." },
      { wrong: "Tell the model \"do not make things up\" and consider the hallucination fixed.", right: "Ground answers in retrieved text, require citations, and give it a way to say the source lacks the value." },
    ],
    exam: "Choose the option that diagnoses from evidence (logs, error pattern) before acting. A consistent pattern is a prompt fix; scattered unsupported facts need grounding.",
    sources: [
      { label: "Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations" },
      { label: "Choosing a model", url: "https://platform.claude.com/docs/en/about-claude/models/choosing-a-model" },
    ],
  },
  {
    id: "4.5",
    tldr: "Each lever trades something: caching needs a stable prefix, batches trade latency for 50% off, routing sends easy work to a small tier, trimming context and capping output cut tokens, streaming cuts perceived wait.",
    diagram: {
      kind: "hub",
      title: "Cost-performance levers",
      center: { label: "Cost per task vs quality vs latency", sub: "Measure on the eval set before and after" },
      spokes: [
        { label: "Prompt caching", sub: "Static first; reads ~0.1x, writes 1.25x (5 min) / 2x (1 h)", tone: "good" },
        { label: "Message Batches", sub: "50% off, up to 24 h, no latency SLA", tone: "good" },
        { label: "Tier routing", sub: "Cheap classifier sends easy traffic to a small model", tone: "good" },
        { label: "Trim context", sub: "Shrink stale tool outputs to the fields still needed", tone: "accent" },
        { label: "Cap output", sub: "Set max tokens; ask for concise formats", tone: "accent" },
        { label: "Streaming", sub: "Text appears early: perceived latency, not cost", tone: "accent" },
      ],
    },
    points: [
      "**Caching** matches on the exact prefix (tools, then system, then messages). A timestamp at the top changes it every request: move volatile content after the last breakpoint.",
      "**Batch SLA arithmetic**: a batch may take up to 24 h, so a 30 h deadline means submitting at least every 6 h.",
      "**Routing**: if 80% of traffic is simple look-ups, a cheap classifier plus a small tier for that 80% cuts spend without touching the hard 20%.",
      "**Agent loops** resend the whole history each turn. Old 10,000-token tool outputs compound cost: keep only the fields still needed.",
      "**Streaming** fixes a blank-screen wait without lowering quality; it does not reduce tokens.",
    ],
    traps: [
      { wrong: "Caching improves answer quality and works on any prefix size.", right: "It cuts cost and time-to-first-token only, and a prefix below the model's minimum is silently not cached." },
      { wrong: "Batches guarantee results within an hour.", right: "Most finish under an hour, but the only bound is 24 h; there is no latency SLA." },
    ],
    exam: "Match the lever to the bottleneck: repeated static prefix means cache, deadline-tolerant volume means batch, mixed difficulty means route, waiting user means stream.",
    sources: [
      { label: "Prompt caching", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-caching" },
      { label: "Batch processing", url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing" },
      { label: "Choosing a model", url: "https://platform.claude.com/docs/en/about-claude/models/choosing-a-model" },
    ],
  },
  {
    id: "4.6",
    tldr: "Log every model and tool call with its version, tokens, latency and stop_reason; trace multi-step runs end to end; sample transcripts for graded review; alert on drift. Redact PII before anything is written.",
    diagram: {
      kind: "flow",
      title: "Observability loop",
      steps: [
        { label: "Log each call", sub: "request ID, prompt + model version, tokens, latency, stop_reason", edge: "link" },
        { label: "Trace the run", sub: "Every model and tool call of one task, end to end (OpenTelemetry)", edge: "sample" },
        { label: "Grade a sample", sub: "Live transcripts scored like the offline eval", edge: "watch" },
        { label: "Alert on drift", sub: "Quality, input mix, cost and latency trends", tone: "warn" },
      ],
      loop: "Failures found in production become regression cases in the eval set",
    },
    points: [
      "**Token usage split** into input, cache read, cache write and output, plus the **prompt version and model** per request, explains a cost jump with flat traffic.",
      "The **cache-read count** in each response's `usage` block is what proves the cached prefix is reused.",
      "**Traces** link each step's inputs and outputs. With only the final answer logged, you cannot tell which step of an agent went wrong.",
      "**Drift** happens without code changes: a new product line shifts the input mix. Sample and grade live traffic and alert on quality and mix changes.",
      "**PII in logs**: redact before writing, set a retention policy, keep request IDs for correlation. Claude Code can export **OpenTelemetry** metrics and events to an existing collector.",
    ],
    traps: [
      { wrong: "Log only final responses to save storage.", right: "Multi-step failures need per-step traces with inputs, outputs and stop_reason." },
      { wrong: "Stop logging transcripts because they contain account numbers.", right: "Redact at write time and enforce retention; observability and privacy both survive." },
    ],
    exam: "The right answer captures versions, token breakdown and stop_reason per call, traces the whole run, and treats PII redaction and retention as part of the logging design.",
    sources: [
      { label: "Claude Code monitoring (OpenTelemetry)", url: "https://code.claude.com/docs/en/monitoring-usage" },
      { label: "Prompt caching", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-caching" },
    ],
  },
);

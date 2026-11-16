/* ============================================================================
   CCAR-P lessons — Domain 1: Solution Design & Architecture
   One short lesson per objective. Written from tools/facts.md and the public
   Exam Guide v1.0. Schema: see tools/check-lessons.mjs.
   ============================================================================ */
window.CCARP_LESSONS = window.CCARP_LESSONS || [];
window.CCARP_LESSONS.push(
  {
    id: "1.1",
    tldr: "Turn \"use AI for X\" into one concrete task with a measurable target, then split the work: Claude reads and drafts, code computes and writes, a human stays accountable where the stakes demand it.",
    diagram: {
      kind: "compare",
      title: "Who does what in a Claude solution",
      columns: [
        { title: "Claude", items: ["Reads variable, unstructured language", "Classifies, extracts, drafts, explains", "Answers grounded in your sources, with citations"] },
        { title: "Deterministic code", items: ["Exact arithmetic and business rules", "System writes, exposed to Claude as tools", "Validation checks before anything is booked"] },
        { title: "Human", items: ["Approves outputs with legal or patient impact", "Checks a draft faster than writing it", "Owns the decision and the recourse"] },
      ],
      caption: "A process is a strong candidate when its input is messy language and checking a draft is far cheaper than producing it.",
    },
    points: [
      "**Problem before technology**: reduce the ask to a specific task (e.g. size guidance to cut returns) with a **success metric** and a baseline. Model tier and architecture come after, from evals.",
      "**LLM fit**: unstructured, variable input that rules handle poorly, and output a person or code can verify cheaply. Bit-exact figures belong in **code exposed as a tool**, with Claude explaining the result.",
      "**Start simple**: one well-prompted call with retrieval and examples. A fixed process becomes a workflow, not an agent, whatever the sponsor calls it.",
      "**Constraints shape the design**: no one waiting → **Message Batches** (50% price); PHI → **BAA**, eligible setup, minimum necessary data; legal effect or patient impact → an approval gate.",
      "\"Must match our policy\" is a **grounding** problem: retrieve the authoritative text, cite the section, and say when the source is silent.",
    ],
    traps: [
      { wrong: "Pick the model tier first so procurement can start.", right: "Define the task and the metric first; the tier is whatever passes the eval at the lowest cost." },
      { wrong: "Chain-of-thought or a larger model makes Claude's arithmetic exact.", right: "Reasoning helps but stays probabilistic. Regulator-grade numbers come from deterministic code." },
      { wrong: "A general chatbot answering from its own knowledge solves a policy-lookup problem.", right: "Answers must be grounded in the policy library and traceable to it." },
    ],
    exam: "The right option names a concrete task, a measurable target and the simplest design that honours every stated constraint. Options that lead with technology (\"autonomous agent\", \"largest model\", \"chatbot\") are distractors.",
    sources: [
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
      { label: "Define your success criteria", url: "https://platform.claude.com/docs/en/test-and-evaluate/define-success" },
    ],
  },
  {
    id: "1.2",
    tldr: "An end-to-end design covers input, processing, validation, output and a feedback loop. Each stage has one job, and the loop turns human corrections into eval cases.",
    diagram: {
      kind: "flow",
      title: "Input → processing → output → feedback",
      steps: [
        { label: "Input", sub: "normalise formats, screen, treat emails and documents as data", edge: "clean fields" },
        { label: "Processing", sub: "Claude + retrieval + tools, least privilege per step", edge: "draft" },
        { label: "Validation", sub: "schema + code checks (totals sum) before any write", tone: "accent", edge: "pass" },
        { label: "Output", sub: "system write or human approval gate, per risk" },
        { label: "Feedback", sub: "corrections → labelled data → eval set", tone: "good" },
      ],
      loop: "Corrections and incidents become regression cases, then prompt and example updates",
    },
    points: [
      "**Privilege isolation**: the step that reads untrusted text (supplier emails) has no action tools. It passes structured fields to an action step behind a **human approval** gate.",
      "**Structured outputs** guarantee valid JSON, declared types and required fields, but not meaning. Put a **code check** between extraction and the system of record.",
      "**One path per SLA**: interactive traffic goes synchronous with prompt caching and streaming; work that can wait goes through **Message Batches**, joined back by `custom_id`, since results arrive in any order.",
      "**Feedback loop**: capture reviewer corrections, track the **override rate**, add every incident as a regression case, and **sample auto-approved outputs** so drift is caught.",
      "**Trace every step**: `request_id`, prompt and model version, tokens, `stop_reason` and tool calls, so a bad output can be traced to the step that caused it.",
    ],
    traps: [
      { wrong: "Schema-constrained output alone keeps wrong totals out of the ERP.", right: "Constrained decoding fixes format, not semantics. Add a business-rule check in code." },
      { wrong: "Append every reviewer comment to the system prompt so the model learns.", right: "Turn corrections into vetted labelled data that feeds evals and deliberate prompt changes." },
      { wrong: "Add a final evaluator step to fix errors of unknown origin.", right: "Trace each step first. An evaluator hides the root cause instead of locating it." },
    ],
    exam: "Pick the option that puts a deterministic control at the risky boundary (validation before writes, approval before irreversible actions) and closes the loop with measured feedback, not informal review.",
    sources: [
      { label: "Structured outputs", url: "https://platform.claude.com/docs/en/build-with-claude/structured-outputs" },
      { label: "Batch processing", url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing" },
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
    ],
  },
  {
    id: "1.3",
    tldr: "Pick the least autonomous pattern that meets the requirement: a single augmented call, then a fixed workflow, and an agent only when the steps cannot be known in advance.",
    diagram: {
      kind: "decision",
      title: "Which architectural pattern?",
      question: "Can you write the steps down before the request arrives?",
      branches: [
        { when: "One step is enough", then: "Augmented LLM — one call + retrieval, tools, memory", tone: "good" },
        { when: "Yes, the path is fixed", then: "Workflow — chaining, routing, parallelization…", tone: "good" },
        { when: "No, the path depends on findings", then: "Agent — the model picks its next tool in a loop", tone: "warn" },
      ],
      caption: "Each step to the right adds cost, latency and new failure modes. Climb only when evals show the simpler pattern falls short.",
    },
    points: [
      "**Augmented LLM**: one model call enriched with retrieval, tools and memory. It is the building block of every other pattern.",
      "**Workflows** follow code paths you wrote: prompt chaining, routing, parallelization (sectioning or voting), orchestrator-workers, evaluator-optimizer.",
      "**Agents** choose their own path in a loop. They suit open-ended problems, but cost more, are slower, and their errors compound.",
      "Agent go/no-go: **complexity**, **value**, **viability** and **cost of error**. A \"no\" on any one means stay at a simpler tier.",
    ],
    table: {
      head: ["Pattern", "Use it when", "Example"],
      rows: [
        ["Prompt chaining", "Fixed sequence, each step checkable", "Draft → check against policy → translate"],
        ["Routing", "Distinct input types need different handling", "Billing vs technical tickets"],
        ["Parallelization", "Independent sub-tasks, or several votes", "Review sections in parallel"],
        ["Orchestrator-workers", "Sub-tasks only known at run time", "Code change touching unknown files"],
        ["Evaluator-optimizer", "Clear quality criteria, iteration helps", "Generate → critique → revise"],
      ],
    },
    traps: [
      { wrong: "Use an agent because the business owner asked for \"AI that decides\".", right: "Recommend the simplest pattern that meets the measured need, and say why in business terms." },
      { wrong: "Prompt chaining is too slow, so always run everything in one call.", right: "Chaining trades latency for accuracy and auditability; that is often the right trade." },
    ],
    exam: "When the scenario's steps are predictable or audit matters, the answer is a workflow. An agent is right only when the path truly depends on what is discovered.",
    sources: [
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
    ],
  },
  {
    id: "1.4",
    tldr: "A coordinator delegates to subagents that start with a fresh context, their own tools and their own tier. Split only work that is independent; tightly coupled work stays with one agent.",
    diagram: {
      kind: "hub",
      title: "Coordinator and subagents",
      center: { label: "Coordinator", sub: "holds the user context, plans, delegates, synthesises" },
      edge: "explicit prompt in → concise summary out",
      spokes: [
        { label: "Research subagent", sub: "web tools only; receives a de-identified question", tone: "good" },
        { label: "Records subagent", sub: "chart tools; PHI never leaves it" },
        { label: "Extraction workers", sub: "fast low-cost tier, confirmed by an eval", tone: "accent" },
        { label: "Log explorer", sub: "reads the verbose output so the coordinator does not have to" },
      ],
      caption: "Each spoke sees only what its prompt says. Each one adds tokens and coordination cost.",
    },
    points: [
      "**Fresh context**: a default subagent gets no parent history, tool results or system prompt. Put every fact it needs (company, period, constraints) in the delegation prompt. Exception: **forks** inherit the conversation.",
      "**Parallelism**: several `Agent` (formerly `Task`) tool calls in **one** coordinator response. The coordinator needs that tool in `allowedTools`.",
      "In an `AgentDefinition`, the **`description`** tells the coordinator when to delegate. The `prompt` is the subagent's own instructions; `tools` and `model` scope it.",
      "**Per-role design**: least-privilege tools per agent enforce compliance boundaries, and mixed tiers (strong planner, cheap workers) control cost.",
      "**Context isolation** is a reason to delegate in itself: verbose exploration happens elsewhere and only a summary comes back.",
    ],
    traps: [
      { wrong: "Subagents automatically share the coordinator's memory.", right: "They start fresh. Context must be passed explicitly in the prompt." },
      { wrong: "Five agents editing one tightly coupled document, plus a reconciling agent.", right: "Shared, evolving state favours one agent. Multi-agent pays off on independent work." },
      { wrong: "Tell the web-facing agent not to include patient data.", right: "Do not give it chart access at all. Tool scoping is preventive; instructions are probabilistic." },
    ],
    exam: "Correct answers pass context explicitly, scope tools and tiers per role, and fan out with several calls in one response. Be wary of \"shared memory\", \"bigger window\" and \"more agents\".",
    sources: [
      { label: "Agent SDK: subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents" },
      { label: "How we built our multi-agent research system", url: "https://www.anthropic.com/engineering/multi-agent-research-system" },
    ],
  },
  {
    id: "1.5",
    tldr: "Decompose by how the subtasks relate: a sequence becomes a gated chain, independent parts run in parallel, an oversized input is mapped then reduced. Every subtask gets one checkable objective.",
    diagram: {
      kind: "decision",
      title: "Which decomposition?",
      question: "How do the pieces of the task relate to each other?",
      branches: [
        { when: "Fixed sequence, each step checkable", then: "Prompt chain with a programmatic gate after risky steps", tone: "good" },
        { when: "Independent parts", then: "Sectioning: run in parallel, then aggregate", tone: "good" },
        { when: "Same task, need confidence", then: "Voting: run it N times and compare", tone: "accent" },
        { when: "Input too large or details lost mid-document", then: "Focused passes or map-reduce, then a synthesis pass", tone: "warn" },
      ],
    },
    points: [
      "**Prompt chaining** trades latency for accuracy: each call does a narrower, easier job, but the calls run in sequence.",
      "**Gates** catch a malformed output where it appears (validate the step-2 table, then stop or retry) instead of letting it corrupt later steps.",
      "**Lost in the middle**: one pass over a 300-page document misses mid-document items. Run focused passes per section, then merge the findings.",
      "**Map-reduce** for corpora larger than any window: summarise partitions independently (via batches if no one waits), then reduce the summaries.",
      "**Long jobs need state outside the model**: a **manifest** of per-item status lets a crashed run resume only the unfinished work.",
      "Good subtasks: split on independent inputs, give each **one verifiable objective**, and pass each worker the context it needs.",
    ],
    traps: [
      { wrong: "A bigger context window fixes items missed in a long document.", right: "Window size does not fix attention dilution. Focused passes do." },
      { wrong: "Ask the final step to reflect on whether anything upstream went wrong.", right: "Gate the step where errors originate, before they propagate." },
      { wrong: "More parallel workers always improve results.", right: "Each worker adds tokens and coordination. Parallelise only independent subtasks." },
    ],
    exam: "Match the pattern to the dependency structure named in the stem: sequence → chain + gate, independent → sectioning, too big → map-reduce, crash-prone → manifest.",
    sources: [
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
      { label: "Effective context engineering", url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" },
    ],
  },
  {
    id: "1.6",
    tldr: "Tie every solution to a named value pillar and prove it with an outcome metric against a baseline. Count the full cost, segment the results, and engineer the SLA with concrete levers.",
    diagram: {
      kind: "hub",
      title: "Value pillars and how to prove them",
      center: { label: "Business case", sub: "outcome metric vs a pre-rollout baseline" },
      spokes: [
        { label: "Efficiency", sub: "same work, fewer resources: time or hours per case" },
        { label: "Transformation", sub: "a service that was not feasible before (24/7, multilingual)", tone: "accent" },
        { label: "Productivity", sub: "more output per person: lead time, defect rate" },
        { label: "Cost", sub: "cost per resolved outcome, incl. review and rework", tone: "good" },
        { label: "Performance SLAs", sub: "p95 latency, deadline, quality floor" },
      ],
    },
    points: [
      "Measure **outcomes, not activity**: cost per resolved ticket, change lead time or escaped defects. Tickets touched, lines generated or prompts sent are not value.",
      "**Full cost** = tokens + tooling + **human review and rework**. Token spend alone ignores the labour the business wants reduced.",
      "**Segment** before a go decision: a 92% aggregate can hide a failing segment that carries most of the revenue.",
      "**SLA levers**: cache the static prefix and stream (latency); pick the smallest tier that holds the eval baseline (quality and cost); send deferrable work to **batches** (50% price, up to 24 h).",
      "Scarce human capacity is value too: **risk-based routing** puts reviewers on the riskiest cases, with QA sampling on the rest.",
    ],
    traps: [
      { wrong: "Downgrade every workload to the cheapest tier to hit budget.", right: "Batch and cache what can wait or repeats. Change a tier only after an eval." },
      { wrong: "A new 24/7 service is efficiency because it is automated.", right: "Doing what was impossible before is transformation. Efficiency is existing work with fewer resources." },
      { wrong: "Batch peak-time interactive traffic to save money.", right: "Batches have no latency SLA. They suit deferrable work only." },
    ],
    exam: "Prefer the option with a baseline comparison, full cost, segmented results and levers that meet the SLA without breaking the quality floor. Vanity metrics and \"felt better\" pilots are wrong.",
    sources: [
      { label: "Define your success criteria", url: "https://platform.claude.com/docs/en/test-and-evaluate/define-success" },
      { label: "Prompt caching", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-caching" },
      { label: "Batch processing", url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing" },
    ],
  },
);

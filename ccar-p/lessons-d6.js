/* ============================================================================
   CCAR-P lessons — Domain 6: Stakeholder Communication & Lifecycle Management
   One short lesson per objective. Written from tools/facts.md and the public
   Exam Guide v1.0. Schema: see tools/check-lessons.mjs.
   ============================================================================ */
window.CCARP_LESSONS = window.CCARP_LESSONS || [];
window.CCARP_LESSONS.push(
  {
    id: "6.1",
    tldr: "Discovery turns a sponsor's wish into a problem you can design for: real users and workflow, a measurable success metric with a baseline, and the constraints that bound the architecture.",
    diagram: {
      kind: "compare",
      title: "What discovery should produce",
      columns: [
        { title: "Wish-list (don't)", tone: "bad", items: [
          "\"An AI assistant for the claims team\"",
          "\"It must be real time\"",
          "\"Make support faster with AI\"",
          "\"It needs an agent\" / \"use the biggest model\"",
        ] },
        { title: "Discovery brief (do)", tone: "good", items: [
          "Users, workflow step fed, who acts on the output",
          "\"Ready by Monday 08:00\" → batch is acceptable",
          "Median first response 4 h → 1 h in 4 weeks, CSAT ≥ baseline",
          "Pattern and model tier decided later, by eval",
        ] },
      ],
      caption: "Capture problems and measurable constraints, not features or solutions.",
    },
    points: [
      "Start with the **people and the workflow**: who uses it, which step the output feeds, volumes, and who acts on the result. Interview handlers, not just the sponsor.",
      "Write a **success metric with a baseline**: specific, measurable, time-bound, plus a guard metric (e.g. CSAT must not drop). It becomes the go/no-go test and the first eval target.",
      "Translate vague words into **constraints tied to how output is consumed**: latency, cost, volume. \"Real time\" read at a weekly meeting means asynchronous batch at half the price.",
      "Settle **data and compliance** early: what personal data is involved, where it may be processed, retention in logs, vector stores and caches. These change the architecture, not just the paperwork.",
      "Produce an **integration inventory** (system, read/write, auth model, rate limits, owner) and the **risk tolerance**: which errors are unacceptable, which outputs have legal effect, reviewer capacity.",
      "\"Needs an agent\" is a hypothesis: test it on **complexity, value, viability, cost of error**. Number of agents and model tier are design outputs, never discovery inputs.",
    ],
    traps: [
      { wrong: "Build a broad prototype with access to everything, then narrow scope.", right: "It fixes scope and permissions before the need is known. Discover first, then prototype the narrow, measured case." },
      { wrong: "A signed feature wish-list is the requirements document.", right: "Features are solutions. Requirements are the problem, the metric with its baseline, and the constraints." },
      { wrong: "Pilot users saying it \"feels helpful\" is a success criterion.", right: "A vibe check is not falsifiable. Use a number, a baseline, a deadline and a guard metric." },
    ],
    exam: "Pick the option that gathers facts about users, workflow, metrics with baselines, data sensitivity or integrations before any build. Options that pick a model, an agent count or a demo first are wrong.",
    sources: [
      { label: "Define your success criteria", url: "https://platform.claude.com/docs/en/test-and-evaluate/define-success" },
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
    ],
  },
  {
    id: "6.2",
    tldr: "Present a trade-off as measured options against the agreed constraints, make a clear recommendation in business terms, and state the residual risk. Don't just list the options.",
    diagram: {
      kind: "decision",
      title: "Answering a stakeholder demand",
      question: "What is the stakeholder asking for?",
      branches: [
        { when: "\"100% accuracy\"", then: "Measured target on an eval set + human review where errors cost most", tone: "good" },
        { when: "\"An autonomous agent\" for fixed steps", then: "Workflow, with cost, latency and audit reasons + a condition to revisit", tone: "good" },
        { when: "\"The best model\"", then: "Cost per 1,000 tasks vs accuracy per tier; cheapest that passes wins", tone: "good" },
        { when: "\"Just give us the options\"", then: "Options + a recommendation + the residual risk and how it is monitored", tone: "accent" },
      ],
      caption: "The architect recommends. Neutral option lists leave the decision without the expert's judgement.",
    },
    points: [
      "Express every option in the **decision-maker's units**: cost per task, p95 latency against the budget, error rate and its business consequence (refunds, rework, legal exposure).",
      "Claude is **probabilistic**: never promise 100% or identical outputs. Turn the demand into a measured target and put human review where an error is expensive.",
      "When two options both meet the target, recommend the **cheaper or simpler** one, and route hard cases to a larger tier if needed. The extra points the target does not need are not worth paying for.",
      "Know which lever moves which metric: **prompt caching** cuts cost (reads ≈ 0.1× input price) and time-to-first-token but not quality; **Message Batches** halve price with no latency guarantee (up to 24 h).",
      "For legal and privacy questions, answer with a **data-flow walk-through**: every store the solution adds (logs, vector index, cache), its retention and its deletion route.",
    ],
    traps: [
      { wrong: "Stay neutral: present the options and let the budget holder choose.", right: "Quantify both sides, recommend one, and state the residual risk. Deferring abandons the architect's role." },
      { wrong: "\"The API is stateless, so customer data goes nowhere.\"", right: "The solution's own logs, vector stores and caches hold data. Name each one with its retention." },
      { wrong: "Enabling caching will also make answers more accurate.", right: "Caching reuses a processed prefix. It changes cost and latency, not what the model answers." },
    ],
    exam: "The right option quantifies the trade-off against stated constraints, recommends the simplest option that meets them, and names the remaining risk. Wrong ones promise certainty, pick the biggest model or decline to recommend.",
    sources: [
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
      { label: "Choosing a model", url: "https://platform.claude.com/docs/en/about-claude/models/choosing-a-model" },
      { label: "Batch processing", url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing" },
    ],
  },
  {
    id: "6.3",
    tldr: "An SLA is enforceable only with a measurable definition, an agreed measurement method and a miss plan. Feedback is only useful when it becomes regression cases that every release must pass.",
    diagram: {
      kind: "flow",
      title: "A closed feedback loop",
      steps: [
        { label: "Collect feedback", sub: "Ratings, comments, tickets, flagged transcripts", edge: "triage" },
        { label: "Categorise failures", sub: "Reproduce, group by pattern and segment", edge: "confirm" },
        { label: "Add regression cases", sub: "Into the versioned eval set", tone: "accent", edge: "fix" },
        { label: "Fix + eval gate", sub: "Release only if the whole set still passes", tone: "good", edge: "report" },
        { label: "Report back", sub: "Per release: what was fixed, metrics vs SLA" },
      ],
      loop: "Next release",
      caption: "Without the regression step, same-day fixes silently break other cases and old failures come back.",
    },
    points: [
      "**SLA anatomy**: (1) a measurable definition (p95 ≤ 3 s, ≥ 95% rubric score), (2) how and where it is measured (gateway logs, a stratified eval), (3) the **miss plan**: who is notified, the fallback, a root-cause review with a deadline.",
      "**Batch SLA arithmetic**: worst case = wait before submission + 24 h of processing. A 30 h commitment needs submissions at least every 6 h.",
      "**Align expectations on variance**: wording will differ between runs. Agree what must stay fixed (facts, citations, format) and test exactly that.",
      "**Report segments, not just the aggregate**: 94% overall can hide 78% on one language. Surface the gap, then agree a per-segment threshold and a remediation owner and date.",
      "**Conflicting feedback** (longer vs shorter answers) becomes an A/B test: one change, a metric tied to the shared goal, guard metrics, enough sample.",
    ],
    traps: [
      { wrong: "\"Responds quickly and accurately, reviewed quarterly\" is an SLA.", right: "Without a threshold, a measurement method and a miss plan, nobody can tell whether it was met." },
      { wrong: "Promise users identical answers to the same question.", right: "Outputs are probabilistic. Commit to consistent facts, citations and format, and measure those." },
      { wrong: "Sign off the quarter because the aggregate target was met.", right: "Aggregate accuracy hides failing segments. Report them and make them a measured commitment." },
    ],
    exam: "Prefer the answer that makes a promise measurable (threshold + measurement + miss plan) or turns opinions and complaints into eval cases and experiments. Avoid answers that promise determinism or settle disputes by splitting the difference.",
    sources: [
      { label: "Define your success criteria", url: "https://platform.claude.com/docs/en/test-and-evaluate/define-success" },
      { label: "Create strong empirical evaluations", url: "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests" },
      { label: "Batch processing", url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing" },
    ],
  },
  {
    id: "6.4",
    tldr: "Document for each reader's question: why it was built this way (ADR), where data flows (data-flow diagram), what was proven (eval report), what to do when it breaks (runbook), and where it is weak (known limitations).",
    diagram: {
      kind: "hub",
      title: "One architecture, one document per audience",
      center: { label: "Solution docs pack", sub: "Versioned with the code" },
      spokes: [
        { label: "ADR", sub: "Future architects: context, options, decision, consequences" },
        { label: "Data-flow diagram", sub: "Legal / auditors: where data enters, rests, leaves; retention", tone: "accent" },
        { label: "Eval report", sub: "Risk committee: dataset, grading method, results per segment" },
        { label: "Runbook", sub: "On-call: alert → diagnosis → rollback → escalation", tone: "good" },
        { label: "Known limitations", sub: "Users: measured weak spots, mandatory human sign-off" },
        { label: "Implementation guide", sub: "Product teams: rules such as cache-friendly prompt order" },
      ],
    },
    points: [
      "An **architecture decision record (ADR)** answers \"why?\" months later: context, options weighed, decision, accepted trade-offs. A component diagram only shows what was built.",
      "**Prompts are code**: version them in source control, log prompt and model version on every request, and link each version to the eval run that approved it. A wiki page cannot tell you what was live last Tuesday.",
      "A **runbook** maps each alert and threshold to diagnosis steps, a safe action (roll back to the last known-good prompt version) and escalation contacts, so on-call staff can act without the build team.",
      "**Eval evidence** in writing: dataset sources, size, segments and version; grading method and how the LLM judge was calibrated against humans; results per segment.",
      "**Implementation guidance** encodes rules teams get wrong, e.g. for caching: tools and static instructions first, cache breakpoint after them, user data and timestamps after the last breakpoint.",
    ],
    traps: [
      { wrong: "The component diagram explains why the agent option was rejected.", right: "Diagrams record the what. Only an ADR keeps the alternatives and the reasoning." },
      { wrong: "Tell auditors the system prompt forbids disclosing PHI.", right: "A prompt is probabilistic, not a data control. Show the data flow, BAA status, retention and audit logs." },
      { wrong: "Known limitations = the model ID and its version.", right: "Users need measured weak spots (81% on scanned PDFs) and where a human must still sign off." },
    ],
    exam: "Match the document to the reader's question: why → ADR, where does data go → data-flow diagram, can we trust it → segmented eval report, what now → runbook. Reject answers that give the right reader the wrong artefact.",
    sources: [
      { label: "Create strong empirical evaluations", url: "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests" },
      { label: "Prompt caching", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-caching" },
    ],
  },
  {
    id: "6.5",
    tldr: "The lifecycle is a loop: discovery and design set the success criteria and the first eval set, handoff transfers operating assets, and monitoring feeds every iteration through that same eval set.",
    diagram: {
      kind: "flow",
      title: "Solution lifecycle",
      steps: [
        { label: "Discovery", sub: "Users, metric + baseline, constraints, risk", edge: "criteria" },
        { label: "Design + build", sub: "Pattern, first eval set, prompt versioning", edge: "eval passes" },
        { label: "Rollout + handoff", sub: "Staged go/no-go; runbook, dashboards, shadow on-call", tone: "accent", edge: "live" },
        { label: "Monitoring", sub: "Per-request logs, segment metrics, drift alerts", tone: "good", edge: "findings" },
        { label: "Iteration", sub: "Eval candidate change → A/B a slice → release" },
      ],
      loop: "New scope or incident → back to discovery",
      caption: "The eval set is born in design and grows with every incident. It is what makes each lap of the loop safe.",
    },
    points: [
      "**Success criteria and the first eval set** are defined in discovery and design, before building, so they drive design choices and acceptance. Production traffic enriches the set later.",
      "**Pilot → production in stages**: go/no-go metrics per stage, monitoring and alerts live, a tested rollback at each step. A big-bang switch-on exposes new segments, load and cost all at once.",
      "**Handoff** transfers operating assets (runbook, dashboards, versioned eval set, prompt history, known limitations) and proves them in a **shadow on-call** period before the build team leaves.",
      "**Monitoring** logs request ID, prompt and model version, token usage including cache reads/writes, latency, `stop_reason` and tool calls, with PII redacted and a retention policy.",
      "**Iteration** treats every change the same way, new model release included: run the versioned eval set, compare quality, latency and cost per segment, A/B a traffic slice, then switch.",
      "Monitoring can reveal **new scope** (30% of questions on an uncovered topic). That starts a new discovery cycle, not a prompt tweak, especially for sensitive data.",
    ],
    traps: [
      { wrong: "Wait for production data before defining success criteria.", right: "Without criteria up front, the design has no target and acceptance becomes subjective." },
      { wrong: "Handoff = repository access plus a walkthrough.", right: "Ops need the eval set, runbook and prompt history to tell a regression from normal variance." },
      { wrong: "After an incident, add an emphatic rule to the prompt and move on.", right: "Add the incident as a regression case that every prompt, model or index release must pass." },
    ],
    exam: "Look for the option that keeps the loop closed: criteria before build, staged rollout with rollback, assets plus a shadow period at handoff, and incidents or new models routed through the versioned eval set.",
    sources: [
      { label: "Define your success criteria", url: "https://platform.claude.com/docs/en/test-and-evaluate/define-success" },
      { label: "Create strong empirical evaluations", url: "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests" },
    ],
  },
);

/* ============================================================================
   CCAR-P lessons — Domain 5: Governance, Safety & Risk Management
   One short lesson per objective. Written from tools/facts.md and the public
   Exam Guide v1.0. Schema: see tools/check-lessons.mjs.
   ============================================================================ */
window.CCARP_LESSONS = window.CCARP_LESSONS || [];
window.CCARP_LESSONS.push(
  {
    id: "5.1",
    tldr: "No single guardrail holds. Stack layers so each catches what the one above misses, and put hard limits in code (tools, hooks, managed settings), never only in the prompt.",
    diagram: {
      kind: "layers",
      title: "Defence in depth for an LLM system",
      layers: [
        { label: "Input screening", sub: "Small, fast classifier model ahead of the main model", tone: "accent" },
        { label: "System-prompt constraints", sub: "Scope, tone, refusal rules: probabilistic", tag: "can be talked past", tone: "warn" },
        { label: "Tool-level permissions and limits", sub: "Least privilege, caps in the tool or a pre-execution hook", tag: "deterministic", tone: "good" },
        { label: "Output validation", sub: "Check drafts for forbidden content before they leave", tone: "accent" },
        { label: "Human review", sub: "For high-impact or flagged items", tone: "good" },
      ],
      caption: "Each layer is measured: false positives and false negatives on a labelled set.",
    },
    points: [
      "**Prompt rules are probabilistic**. A 500 EUR refund cap that users can argue past belongs in the refund tool or a `PreToolUse` hook that denies larger amounts.",
      "**Least privilege ranking**: remove an unneeded tool (preventive) > require confirmation (compensating) > log its use (detective).",
      "**Input classifier**: a small, fast tier tuned on labelled examples screens high volume within a tight latency and cost budget.",
      "**Secrets never in prompts**: keep keys in a vault and inject them into the tool layer at call time.",
      "**Tune guardrails** like any model: over-blocking (8% of legitimate nurse questions) drives users around the system. Measure, adjust thresholds, add a review path.",
    ],
    code: "// managed-settings.json: org policy no developer can override\n{\n  \"permissions\": {\n    \"deny\": [\"Read(./.env)\", \"Read(./.env.*)\"]\n  }\n}",
    traps: [
      { wrong: "Add \"NEVER exceed 500 EUR\" in capitals to the system prompt.", right: "Enforce the limit deterministically in the tool or a hook; the prompt only explains it." },
      { wrong: "A regex blocklist on inputs stops prompt injection.", right: "Isolate privileges and validate actions; blocklists are trivially bypassed." },
    ],
    exam: "Pick the answer that enforces the rule in code at the action boundary and combines several layers. Prompt-only or single-layer answers are the distractors.",
    sources: [
      { label: "Mitigate jailbreaks and prompt injections", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks" },
      { label: "Hooks reference", url: "https://code.claude.com/docs/en/hooks" },
      { label: "Claude Code settings", url: "https://code.claude.com/docs/en/settings" },
    ],
  },
  {
    id: "5.2",
    tldr: "Design around inherent limits instead of assuming them away: outputs vary, fluent claims can be unsupported, errors compound across steps, injected text can steer tools, and some failures look like success.",
    diagram: {
      kind: "hub",
      title: "Failure modes to design around",
      center: { label: "LLM system", sub: "Model + retrieval + tools + loop" },
      spokes: [
        { label: "Non-determinism", sub: "Same input, different output: evals need volume and repeats", tone: "warn" },
        { label: "Hallucination", sub: "Fluent claims the context does not support", tone: "warn" },
        { label: "Prompt injection", sub: "Text in emails or docs steers a privileged tool", tone: "bad" },
        { label: "Compounding errors", sub: "95% per step over 12 steps is about 54% end to end", tone: "bad" },
        { label: "Confused deputy", sub: "Shared admin identity leaks data across users", tone: "bad" },
        { label: "Silent failures", sub: "Refusal as HTTP 200; valid JSON with wrong totals", tone: "warn" },
      ],
    },
    points: [
      "**Injection** is a privilege problem: a summariser reading vendor emails must not hold the tool that changes bank details. Split the capability and gate the change on a human.",
      "**Compounding**: long autonomous chains multiply step error rates. Prefer a workflow with validation gates and explicit stop conditions on failure.",
      "**Confused deputy**: an agent querying HR with a shared all-access account can be asked for anyone's record. Use the user's delegated, scoped credentials.",
      "**Retrieval leaks**: one vector store across departments needs **permission-aware retrieval**, filtered by the requesting user's rights at query time.",
      "**Looks-like-success**: a refusal arrives as HTTP 200 with `stop_reason: \"refusal\"`; strict schemas guarantee structure, not that line items sum to the total.",
    ],
    traps: [
      { wrong: "Strict structured output means the data is correct.", right: "Constrained decoding enforces shape only; add semantic checks such as computed versus stated totals." },
      { wrong: "A larger model resists prompt injection, so upgrade.", right: "Remove the dangerous capability from the exposed agent and require approval for irreversible actions." },
    ],
    exam: "When untrusted content meets a privileged action, the answer separates them. When an answer \"always parses\" or returns 200, look for the missing semantic or stop_reason check.",
    sources: [
      { label: "Mitigate jailbreaks and prompt injections", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks" },
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
      { label: "Structured outputs", url: "https://platform.claude.com/docs/en/build-with-claude/structured-outputs" },
    ],
  },
  {
    id: "5.3",
    tldr: "Reviewer capacity is finite, so spend it by risk: hard approval gates on irreversible actions, explicit-criteria routing for the risky middle, sampled QA on what was auto-approved.",
    diagram: {
      kind: "decision",
      title: "Where does a human belong?",
      question: "What happens if this decision is wrong?",
      branches: [
        { when: "Irreversible or high value (write-off, wire)", then: "Approval gate enforced in a pre-execution hook", tone: "good" },
        { when: "Legal or similar effect on a person", then: "Reviewer with real authority, reasons shown, contest route", tone: "good" },
        { when: "Matches an explicit risk or escalation criterion", then: "Route to a reviewer queue", tone: "accent" },
        { when: "Low risk and reversible", then: "Auto-approve, then stratified-sample for QA", tone: "accent" },
      ],
    },
    points: [
      "**Gate in code**: with the Agent SDK, a pre-execution hook on the wire tool pauses each call until a human approves. A prompt instruction to \"ask first\" is not a control.",
      "**Explicit triggers** beat sentiment scores or self-reported confidence: a request for a human, a policy exception, a legal threat.",
      "**Sampling auto-approved items** catches systematic errors that routing never surfaces, and recalibrates thresholds. Stratify the sample.",
      "**Rubber-stamping**: 99.6% approval at four seconds per memo is not review. Show the evidence and flagged reasons, and seed known-flawed items to measure the catch rate.",
      "**GDPR Art. 22** limits solely automated decisions with legal effects: the human must be able to change the outcome, not just click through.",
    ],
    traps: [
      { wrong: "Send every decision to reviewers to be safe.", right: "Capacity runs out and quality collapses; route by risk and sample the rest." },
      { wrong: "Escalate when the model says it is unsure.", right: "Self-reported confidence is unreliable; use explicit, checkable criteria." },
    ],
    exam: "Match human effort to reversibility and impact. The correct option gates irreversible actions deterministically and samples the high-volume, low-risk flow.",
    sources: [
      { label: "Agent SDK hooks", url: "https://code.claude.com/docs/en/agent-sdk/hooks" },
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
    ],
  },
  {
    id: "5.4",
    tldr: "Compliance is an architecture property: follow personal or regulated data through every component (model call, logs, vectors, caches, evals) and apply minimisation, contracts, location, retention and erasure to all of them.",
    diagram: {
      kind: "flow",
      title: "Follow the data through the system",
      steps: [
        { label: "Ingest", sub: "Minimise: send only what the task needs; redact or pseudonymise the rest", edge: "process" },
        { label: "Process", sub: "Contract in place (DPA, BAA), eligible config, processing location", edge: "store" },
        { label: "Store", sub: "Logs, vectors, caches, eval sets: same region and retention rules", edge: "retire" },
        { label: "Erase and audit", sub: "Delete every copy on request; keep access audit trails", tone: "good" },
      ],
      caption: "The model call is one component. The derived copies around it are where audits fail.",
    },
    points: [
      "**GDPR**: lawful basis, minimisation, purpose limitation, a DPA with processors, transfer and residency rules, and a **DPIA before** processing that is likely high risk.",
      "**Right to erasure** reaches transcripts, application logs, embeddings built from the person's data and caches, not just the CRM record.",
      "**HIPAA**: PHI only with a **Business Associate Agreement** and an eligible configuration, minimum-necessary inputs, audit logs; de-identify where possible.",
      "**FedRAMP**: federal data must stay inside the authorised boundary. Every component handling it, logging and evaluation included, must sit in that boundary.",
      "**Zero data retention** arrangements exist for eligible API use, but some features are unavailable under ZDR: verify every feature the design relies on.",
    ],
    traps: [
      { wrong: "The model endpoint is compliant, so the solution is compliant.", right: "Logs, vector stores, monitoring and eval copies must meet the same residency and retention rules." },
      { wrong: "Answer by recalling which product holds which certification level.", right: "Certification lists change; the exam tests the controls: contracts, boundaries, minimisation, erasure." },
    ],
    exam: "The right answer extends the control to every place the data lands, puts the contract or assessment in place before processing, and sends the minimum data needed.",
    sources: [
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
    ],
  },
  {
    id: "5.5",
    tldr: "Fairness is measured, not assumed: test outcomes per demographic slice, watch for proxies, disclose AI use, give decision-specific reasons and a route to a human, and document it all in a system card.",
    diagram: {
      kind: "compare",
      title: "Fairness by omission vs by measurement",
      columns: [
        { title: "By omission", tone: "bad", items: [
          "Drop gender and ethnicity fields and call it fair",
          "Report one overall agreement score",
          "Generic reasons: \"our model assessed your file\"",
          "Customers never told AI was involved",
        ] },
        { title: "By measurement", tone: "good", items: [
          "Compare selection and error rates per slice; hunt proxies such as postcode",
          "Calibrate any LLM judge against diverse raters, per group",
          "Decision-specific factors plus how to request review",
          "Disclose AI use up front, with a route to a human",
        ] },
      ],
      caption: "A system card records intended use, limits and per-segment results for reviewers.",
    },
    points: [
      "**Bias testing**: overall accuracy (91% agreement) says nothing about groups. Compare outcomes and errors per demographic slice with fairness metrics such as selection rates.",
      "**Proxies**: removing protected fields does not remove bias when postcode stands in for them. Keep proxies out of the decision and keep measuring outcomes per group.",
      "**Judges can be biased too**: check an LLM judge's agreement with diverse human raters within each group, not only overall.",
      "**Transparency and recourse**: disclose AI use, give the factors the case actually relied on, and offer review by a human with authority.",
      "**Documentation**: a **system card** describes intended use, known limitations and evaluation results including per-segment performance.",
    ],
    traps: [
      { wrong: "Removing protected attributes makes the system fair.", right: "Correlated features recreate them; fairness is shown by per-group outcome metrics." },
      { wrong: "A human makes the final call, so no explanation to the customer is needed.", right: "People affected still need the actual reasons and a way to contest them." },
    ],
    exam: "Prefer options that measure per group, disclose AI involvement, give case-specific reasons and offer human recourse. Aggregate scores and attribute removal are the traps.",
    sources: [
      { label: "Create strong empirical evaluations", url: "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests" },
      { label: "Define your success criteria", url: "https://platform.claude.com/docs/en/test-and-evaluate/define-success" },
    ],
  },
);

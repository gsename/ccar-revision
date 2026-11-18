/* ============================================================================
   CCAR-P revision data — Claude Certified Architect – Professional
   Source: public Exam Guide v1.0 (July 2026) + Anthropic documentation.
   Verbatim guide content lives in blueprint.js (frozen). This file holds what
   we authored: exam facts, domain summaries, takeaways. Lessons: lessons-d*.js.
   Load order (index.html): blueprint.js → q-*.js → lessons-*.js → data.js → ../shared/app.js
   ============================================================================ */
(function () {
  const BP = window.CCARP_BLUEPRINT;

  const EXAM_INFO = {
    titre: "Claude Certified Architect – Professional",
    code: "CCAR-P",
    version: "Exam Guide v1.0 · Effective July 2026",
    items: 63,
    minutes: 120,
    examLengths: [20, 63],
    pass: 720, scaleMin: 100, scaleMax: 1000, echelle: "100 – 1000",
    format: "Multiple-choice and multiple-response items; each item states how many responses to select",
    livraison: "Proctored — online and/or Pearson VUE test centre",
    prix: "175 USD",
    validite: "12 months from the date awarded",
    reussite: "Pass/fail plus a scaled score (100–1,000), with percent-correct per domain — informational only",
    notation: "Criterion-referenced against a fixed standard set by a formal standard-setting study",
    retake: "Wait 14 days after a 1st failure, 30 after a 2nd, 90 after a 3rd — max 4 attempts per rolling 12 months",
    renouvellement: "Free unproctored assessment if renewed on time; otherwise re-sit the full exam at full fee",
    audience: "Mid- to senior architects: 3+ years in systems architecture, 6+ months with LLM systems in production",
    subLabel: "objective", subLabelPlural: "Objectives",
    lsKey: "ccar_p_state_v1",
  };

  /* Authored per-domain description per objective, summary and takeaways. */
  const AUTHORED = {
    1: {
      couleur: "#C9622E",
      resume: "Turning a business problem into the simplest Claude architecture that meets it. The recurring decision is how much autonomy the problem actually needs: a single augmented call, a fixed workflow, or an agent — and every step up must be paid for in cost, latency and failure modes.",
      cles: [
        "Start from the business outcome and its measurable success criteria, then pick the simplest pattern that reaches it.",
        "The augmented LLM (retrieval + tools + memory) is the building block; workflows wire it along fixed paths; agents decide their own path.",
        "Workflow patterns: prompt chaining · routing · parallelization (sectioning, voting) · orchestrator-workers · evaluator-optimizer.",
        "Choose an agent only when steps cannot be known in advance and errors are catchable: complexity, value, viability, cost of error.",
        "An end-to-end design closes the loop: input → processing → output → feedback (user signals, evals, human review) back into prompts and data.",
        "Multi-agent systems pay for context isolation and parallelism with tokens and coordination; use them when subtasks are genuinely independent or too large for one context.",
        "Decompose by independent sub-problems, by data source, or by stage; keep shared state explicit.",
        "Map every design choice to a value pillar — efficiency, transformation, productivity, cost, performance SLA — and say which one it serves.",
      ],
    },
    2: {
      couleur: "#B0472B",
      resume: "Choosing the model tier and writing the prompt layer that makes it reliable: system prompt, templates, guardrails, examples, and a context strategy that keeps quality up and tokens down. Prompt reuse — caching, modular prompts, Skills — is where cost and latency are won.",
      cles: [
        "Tiers: Haiku for high-volume, latency-sensitive, simple work; Sonnet as the balanced production default; Opus for the hardest reasoning and long-horizon agents. Decide with an eval, and mix tiers.",
        "The system prompt carries stable role, rules and format; per-request data goes in the user turn.",
        "Few-shot examples fix format and ambiguous cases; chain-of-thought (or extended thinking) helps multi-step reasoning at a latency and cost premium; zero-shot is fine for simple, well-specified tasks.",
        "Templates separate fixed instructions from variables, tagged clearly (e.g. XML tags), so the prompt can be versioned and tested.",
        "Guardrails in the prompt are a layer, not a control: back them with code where the rule must hold.",
        "Context: include only what the task needs, put long documents before the question, trim tool output, summarise old turns.",
        "Prompt caching: static content first, volatile content after the last breakpoint; it cuts cost and time-to-first-token for a repeated prefix.",
        "Skills package instructions and resources that load on demand — reuse without paying for them on every request.",
      ],
    },
    3: {
      couleur: "#8A6D3B",
      resume: "The heaviest domain: wiring Claude into real systems safely and observably. Least privilege on tools, user-scoped identity, retrieval that fits the data, the right protocol for each connection, and monitoring that sees inside multi-step runs.",
      cles: [
        "Capability bloat: every tool an agent does not need is attack surface and selection noise — remove it rather than guard it.",
        "An agent acting for a user should carry that user's delegated, scoped credentials, not a shared admin key; otherwise you get confused-deputy escalation and no per-user audit trail.",
        "Accuracy vs latency: bigger model, more retrieved chunks, reranking, extra verification passes all add latency — justify each with a measured gain against the SLA.",
        "Observability at scale: trace each run end to end (request ids, tool calls, tokens, latency, stop reasons), sample transcripts, alert on drift.",
        "RAG: chunk along document structure, add context to chunks, combine lexical and semantic search, rerank, filter by metadata and permissions, re-index on change.",
        "Match retrieval to data shape: exact IDs → lexical/keyword; paraphrased questions → semantic; tables → structured query; small corpus → put it in the prompt and cache it.",
        "MCP for reusable tool/data access across hosts; direct API or CLI for one narrow integration; agent-to-agent protocols for delegating to independent peer agents.",
        "Progressive discovery (load names first, details on demand — Skills, tool search, resource listings) beats a monolithic context when the catalogue is large.",
      ],
    },
    4: {
      couleur: "#6B8068",
      resume: "Proving that a Claude system works and keeps working: metrics defined before building, datasets that represent reality, grading methods matched to the task, controlled experiments, and a diagnosis habit that isolates retrieval, prompt and model before changing anything.",
      cles: [
        "Define success criteria up front and measurably: accuracy, latency (p50/p95), cost per task, safety and security rates.",
        "Grade with code where possible, an LLM judge with a rubric where needed (calibrated against humans), humans for the gold standard.",
        "Datasets: real traffic samples, edge cases, adversarial cases, regressions from incidents; segment them; keep a held-out set.",
        "A/B: change one thing, fix the metric and sample size in advance, watch guard metrics; offline eval before online test.",
        "Aggregate scores hide segment failures — always break results down by segment.",
        "Diagnose in order: did retrieval supply the right context? did the prompt specify the task? is the model tier right for it?",
        "Hallucination fixes: grounding in supplied sources, citations, permission to say 'I don't know', retrieval checks.",
        "Optimise with caching, batching for offline work, routing easy cases to smaller models, trimming context, capping output length.",
        "Log request ids, prompt and model versions, token usage incl. cache reads/writes, latency and stop reasons.",
      ],
    },
    5: {
      couleur: "#5E6E8C",
      resume: "Making an LLM system safe enough to own: layered guardrails, a realistic list of failure modes, human review placed where it pays, regulatory obligations designed in from the start, and fairness and transparency measured rather than asserted.",
      cles: [
        "Layer guardrails: input screening, scoped tools, output validation, human approval for high-impact actions. No single layer is enough.",
        "Failure modes: hallucination, prompt injection (direct and via retrieved content), data leakage, over-reliance, drift, runaway cost or loops.",
        "Retrieved and tool content is data, never instructions. Regex blocklists and 'a bigger model' are not defences against injection.",
        "Human-in-the-loop on irreversible or high-value actions and on low-confidence or contradictory cases; sample the auto-approved stream too.",
        "GDPR: lawful basis, minimisation, purpose limitation, erasure across logs, caches and vector stores, residency, DPIA, limits on solely automated decisions.",
        "HIPAA: PHI only under a Business Associate Agreement in an eligible configuration; minimum necessary; audit trail.",
        "FedRAMP: federal workloads must stay inside an authorised boundary — architecture follows the authorisation, not the reverse.",
        "Fairness: test outcomes across demographic and language segments; transparency: disclose AI use, explain decisions, offer recourse.",
      ],
    },
    6: {
      couleur: "#7A5C8A",
      resume: "The architect's job outside the code: discovery that surfaces the real requirement, trade-offs explained in the stakeholder's terms, SLAs that match what an LLM can promise, documentation someone else can build from, and a lifecycle that keeps measuring after go-live.",
      cles: [
        "Discovery: users and workflow, success metrics, data available and its sensitivity, constraints (latency, cost, compliance), integration points, risk tolerance.",
        "Present options with their trade-offs in business terms (cost, time, risk, quality) and a recommendation — not just the technical choice.",
        "Set expectations: LLM output is probabilistic; agree on measurable targets and how they are evaluated, not on 'never wrong'.",
        "SLAs need a measurable definition, a measurement method and a plan for misses; latency SLAs constrain model and architecture choices.",
        "Document decisions (ADRs), architecture, prompts and their versions, eval results, runbooks and known limitations for the team that inherits the system.",
        "Lifecycle: discovery → design → build → handoff → monitoring → iteration; the eval set and the feedback loop survive every phase.",
      ],
    },
    7: {
      couleur: "#4E7D7A",
      resume: "Enabling teams to work with Claude day to day: a shared Claude Code configuration that encodes standards and permissions, AI-assisted workflows that keep a human reviewer in the loop, and a debugging approach that finds what the model actually saw.",
      cles: [
        "Commit the team's Claude Code setup: project CLAUDE.md, `.claude/settings.json` permissions, `.mcp.json`, shared skills — personal tweaks stay in user or local files.",
        "Managed settings enforce organisation policy that projects cannot override; `deny` rules beat `allow`.",
        "Hooks turn 'every time X, do Y' (format, lint, block a path) into deterministic automation.",
        "AI-assisted workflows: plan before large changes, tests first, independent AI review in CI, human approval before merge.",
        "Debugging: check what was in context (`/context`, `/memory`), MCP server status (`/mcp`), `/doctor`, logs with request ids — then the prompt.",
      ],
    },
  };

  const DOMAINS = BP.domains.map((d) => ({
    id: d.id, nom: d.nom, poids: d.poids,
    couleur: AUTHORED[d.id].couleur,
    resume: AUTHORED[d.id].resume,
    cles: AUTHORED[d.id].cles,
    skills: d.objectives.map((o) => ({ nom: `${o.id} ${o.short}`, desc: o.title })),
  }));

  window.CERT = {
    EXAM_INFO,
    DOMAINS,
    SCENARIOS: null,
    QUESTIONS: window.CCARP_QUESTIONS || [],
    LESSONS: window.CCARP_LESSONS || [],
    OVERVIEW: window.CCARP_OVERVIEW || null,
    PREP: BP.prep,
  };
  window.CCARP = window.CERT;
})();

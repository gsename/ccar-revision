/* ============================================================================
   CCAR-P — "Big picture": the course-wide map shown before the lessons.
   Introduces every theme of the course and how the parts fit together.
   {{1.5}} renders as a link to lesson 1.5. Checked by tools/check-lessons.mjs:
   every lesson must be linked from here, and every required theme must appear.
   ============================================================================ */
window.CCARP_OVERVIEW = {
  title: "The big picture",
  teaser: "Every theme of the course on one map: architecture, models, RAG, integration, evaluation, governance, stakeholders, and how they fit together.",
  lead: "Read this first. The course has 38 lessons, but they all describe **one job**: taking a business problem to a Claude system that runs safely in production. This page shows the whole system and the whole journey, what each part is for and how the parts connect. Every numbered tag opens its lesson.",
  sections: [
    {
      id: "map", nav: "The whole map", title: "The whole map on one page",
      intro: "A production Claude system is a **request path** (from the user to the model and back) wrapped in **cross-cutting concerns** (security, evaluation, observability, governance), and delivered through a **lifecycle** with stakeholders.",
      blocks: [
        { type: "diagram", diagram: {
          kind: "nest", title: "Everything in the course, nested",
          nodes: [
            { label: "Why we build it", sub: "the business frame", children: [
              { label: "Business problem", sub: "from \"use AI\" to a measurable task", id: "1.1" },
              { label: "Structured discovery", sub: "users, data, constraints", id: "6.1" },
              { label: "Value pillars", sub: "efficiency, cost, SLAs", id: "1.6" },
            ] },
            { arrow: "drives the design of" },
            { label: "The production system", sub: "the path of one request, left to right", children: [
              { label: "1. Entry", sub: "who is asking, and is it safe?", col: true, grow: 1, children: [
                { label: "AuthN / AuthZ", sub: "delegated user identity", id: "3.2" },
                { label: "Guardrails", sub: "input and output layers", id: "5.1" },
              ] },
              { label: "2. Orchestration", sub: "how the work is organised", col: true, grow: 1, tone: "accent", children: [
                { label: "End-to-end design", sub: "input to feedback loop", id: "1.2" },
                { label: "Architectural patterns", sub: "workflow, agent, augmented LLM", id: "1.3" },
                { label: "Multi-agent design", sub: "orchestrator and subagents", id: "1.4" },
                { label: "Decomposition", sub: "split complex problems", id: "1.5" },
              ] },
              { label: "3. Model", sub: "the reasoning layer", col: true, grow: 1, children: [
                { label: "Model selection", sub: "Haiku, Sonnet, Opus", id: "2.1" },
                { label: "System prompts", sub: "role, rules, templates", id: "2.2" },
                { label: "Prompting techniques", sub: "zero-shot, few-shot, CoT", id: "2.3" },
                { label: "Context and tokens", sub: "the window is a budget", id: "2.4" },
                { label: "Prompt reuse", sub: "caching, modules, Skills", id: "2.5" },
              ] },
              { label: "4. Knowledge and actions", sub: "what the model can reach", col: true, grow: 1, children: [
                { label: "RAG pipeline", sub: "chunk, index, retrieve", id: "3.5" },
                { label: "Retrieval strategy", sub: "match data shape", id: "3.6" },
                { label: "Integration mechanism", sub: "MCP, API/CLI, A2A", id: "3.7" },
                { label: "Capability bloat", sub: "least privilege on tools", id: "3.1" },
                { label: "Progressive discovery", sub: "load details on demand", id: "3.8" },
              ] },
            ] },
            { label: "Wrapped around every request", sub: "cross-cutting concerns", tone: "warn", children: [
              { label: "Accuracy-latency trade-offs", id: "3.3" },
              { label: "Observability at scale", id: "3.4" },
              { label: "Monitoring", id: "4.6" },
              { label: "Risks and failure modes", id: "5.2" },
              { label: "Human-in-the-loop", id: "5.3" },
              { label: "Regulatory compliance", sub: "GDPR, HIPAA, FedRAMP", id: "5.4" },
              { label: "Ethical AI", sub: "bias, fairness, transparency", id: "5.5" },
            ] },
            { arrow: "proved, improved and handed over through" },
            { label: "Proving it works", sub: "evaluation and optimization", children: [
              { label: "Evaluation metrics", id: "4.1" },
              { label: "Datasets and frameworks", id: "4.2" },
              { label: "A/B testing", id: "4.3" },
              { label: "Diagnosing issues", id: "4.4" },
              { label: "Cost-performance", id: "4.5" },
            ] },
            { label: "Delivering it with people", sub: "stakeholders and teams", children: [
              { label: "Communicating trade-offs", id: "6.2" },
              { label: "Feedback loops and SLAs", id: "6.3" },
              { label: "Documentation", id: "6.4" },
              { label: "Lifecycle phases", id: "6.5" },
              { label: "Team tooling (Claude Code)", id: "7.1" },
              { label: "AI-assisted workflows", id: "7.2" },
              { label: "Debugging and ops", id: "7.3" },
            ] },
          ],
        } },
        { type: "callout", tag: "Keep this sentence in mind", text: "**Choose the simplest design that meets a measured requirement.** Almost every question on this exam rewards that reasoning: name the constraint, measure it, and add complexity only when an eval shows it is needed." },
      ],
    },
    {
      id: "trace", nav: "One request, step by step", title: "One request, from start to finish",
      intro: "Here is every layer at work in a single request: a claims handler at an insurer asks an assistant whether a claim is covered. Follow the numbers, and watch which concern applies at each step.",
      blocks: [
        { type: "diagram", diagram: {
          kind: "trace",
          steps: [
            { who: "Gateway", title: "The user is identified", text: "The request carries the handler's own delegated, scoped identity, not a shared admin key {{3.2}}." },
            { who: "Guardrail", tone: "warn", title: "The input is screened", text: "A fast check filters unsafe or out-of-scope requests before any expensive work {{5.1}}. Personal data is minimised to what the task needs {{5.4}}." },
            { who: "Orchestrator", tone: "accent", title: "The pattern routes the work", text: "Coverage questions follow a fixed workflow because the steps are known. Only open-ended investigations go to an agent {{1.3}}. Complex cases are decomposed {{1.5}} across subagents {{1.4}}." },
            { who: "Retrieval", tone: "good", title: "Relevant policy text is retrieved", text: "Hybrid search and reranking find the right passages {{3.5}}, the strategy fits the data {{3.6}}, and results are filtered by the user's permissions {{3.2}}." },
            { who: "Tools", tone: "good", title: "Systems are reached through scoped tools", text: "MCP or a direct API connects the claims system {{3.7}}. The agent holds only the tools its role needs {{3.1}}, and details load on demand {{3.8}}." },
            { who: "Model", tone: "accent", title: "Claude answers from the sources", text: "The tier was chosen by an eval {{2.1}}. The system prompt sets rules {{2.2}}, examples fix the format {{2.3}}, the context stays within budget {{2.4}} and the stable prefix is cached {{2.5}}." },
            { who: "Guardrail", tone: "warn", title: "The output is validated", text: "Code checks structure and citations, and a known failure mode such as hallucination is caught before anyone relies on it {{5.2}}." },
            { who: "Human", tone: "bad", title: "A person approves what matters", text: "A denial with legal impact goes to a reviewer. Low-risk answers flow through and are sampled {{5.3}}." },
            { who: "Telemetry", title: "Everything is traced", text: "Request id, prompt version, tokens, latency and tool calls are logged across the run {{3.4}}, feeding dashboards and alerts {{4.6}}." },
            { who: "Feedback", tone: "good", title: "The system learns", text: "Corrections become eval cases {{4.2}}, regressions are diagnosed {{4.4}}, changes are A/B tested {{4.3}} and results are reported against the SLA {{6.3}}." },
          ],
        } },
      ],
    },
    {
      id: "patterns", nav: "Architecture patterns", title: "How much autonomy does the problem need?",
      intro: "Architecture starts with one decision. Each rung adds capability, and also cost, latency and new ways to fail. Climb only as far as the requirement demands {{1.3}}.",
      blocks: [
        { type: "diagram", diagram: {
          kind: "layers", title: "The autonomy ladder, simplest first",
          layers: [
            { label: "Augmented LLM", sub: "one call enriched with retrieval, tools and memory: the building block of everything below", tag: "start here", tone: "good" },
            { label: "Prompt chaining", sub: "fixed sequence of steps with checks between them", tag: "workflow" },
            { label: "Routing", sub: "classify the input, then send it to a specialised path", tag: "workflow" },
            { label: "Parallelization", sub: "independent sections, or several votes on the same task", tag: "workflow" },
            { label: "Orchestrator-workers, evaluator-optimizer", sub: "a model splits work at run time, or critiques and revises a draft", tag: "dynamic workflow" },
            { label: "Autonomous agent", sub: "the model chooses each step in a loop, for paths nobody can predict", tag: "most autonomy", tone: "warn" },
          ],
          axis: "↓ more autonomy, more cost, more latency, more risk",
        } },
        { type: "callout", tag: "Agent go/no-go", text: "Before choosing an agent, check four criteria: **complexity**, **value**, **viability** and **cost of error**. A \"no\" on any of them means staying on a simpler rung {{1.3}} {{1.4}}." },
      ],
    },
    {
      id: "connect", nav: "Knowledge and integration", title: "Connecting Claude to knowledge and systems",
      intro: "A model only knows what reaches it. Three decisions shape that: how knowledge is retrieved, how systems are connected, and how much is loaded up front.",
      blocks: [
        { type: "diagram", diagram: {
          kind: "flow", title: "The RAG pipeline",
          steps: [
            { label: "Chunk", sub: "along document structure", edge: "add context" },
            { label: "Index", sub: "lexical + embeddings + metadata", edge: "at query time" },
            { label: "Retrieve", sub: "hybrid search, permission filters", edge: "top results" },
            { label: "Rerank", sub: "keep the most relevant", edge: "context" },
            { label: "Generate", sub: "grounded answer with citations", tone: "good" },
          ],
          loop: "Re-index whenever the documents change, and evaluate retrieval separately from generation",
          caption: "Lessons {{3.5}} and {{3.6}}. A small knowledge base can skip RAG: put it in the prompt and cache it {{2.5}}.",
        } },
        { type: "diagram", diagram: {
          kind: "compare", title: "Three ways to connect",
          columns: [
            { title: "MCP", items: ["A standard server exposing tools, resources and prompts", "Reused by several hosts or teams"] },
            { title: "Direct API or CLI", items: ["The simplest path for one narrow integration", "No protocol layer to maintain"] },
            { title: "Agent-to-agent (A2A)", items: ["Delegating to an independent peer agent", "Often across vendors or organisations"] },
          ],
          caption: "Lesson {{3.7}}. Whichever you choose, scope capabilities {{3.1}} and identity {{3.2}} tightly.",
        } },
        { type: "diagram", diagram: {
          kind: "decision", title: "Progressive discovery or monolithic context?",
          question: "Is the catalogue of tools and documents large, or mostly irrelevant to each request?",
          branches: [
            { when: "Yes", then: "Progressive discovery: names first, details on demand", tone: "good" },
            { when: "No: small and always needed", then: "Monolithic context, with prompt caching" },
          ],
          caption: "Lesson {{3.8}}. Skills and tool search are the usual mechanisms.",
        } },
      ],
    },
    {
      id: "tradeoffs", nav: "Cost, latency, accuracy", title: "Every lever moves cost, latency and accuracy",
      intro: "Architects justify decisions with these three numbers. Know what each lever actually changes, and prove the effect with an eval {{3.3}} {{4.5}}.",
      blocks: [
        { type: "table",
          head: ["Lever", "Accuracy", "Latency", "Cost", "Lesson"],
          rows: [
            ["Larger model tier", "Better on hard tasks", "Slower", "Higher", "{{2.1}}"],
            ["Route easy cases to a smaller tier", "Same, if the eval confirms it", "Faster", "Lower", "{{4.5}}"],
            ["Prompt caching", "Unchanged", "Faster first token", "Lower on repeated prefixes", "{{2.5}}"],
            ["Message Batches", "Unchanged", "Up to 24 hours", "50% lower", "{{4.5}}"],
            ["More chunks, reranking", "Better when retrieval is the gap", "Slower", "Higher", "{{3.3}}"],
            ["Extra verification pass", "Better", "Slower", "Higher", "{{3.3}}"],
            ["Trim the context", "Same or better", "Faster", "Lower", "{{2.4}}"],
            ["Streaming", "Unchanged", "Feels faster, same total", "Unchanged", "{{4.5}}"],
          ] },
      ],
    },
    {
      id: "safety", nav: "Safety and governance", title: "Safety is a stack of layers",
      intro: "No single control is enough. Each layer catches what the previous one missed, and regulation decides which layers are mandatory.",
      blocks: [
        { type: "diagram", diagram: {
          kind: "layers", title: "Defence in depth",
          layers: [
            { label: "Identity and least privilege", sub: "delegated credentials, only the tools the role needs", tag: "{{3.1}} {{3.2}}" },
            { label: "Input guardrails", sub: "screen requests; treat retrieved content as data, never as instructions", tag: "{{5.1}}" },
            { label: "Prompt-level rules", sub: "useful, but probabilistic: never the only control", tag: "{{2.2}}" },
            { label: "Output validation", sub: "structure, citations, policy checks in code", tag: "{{5.1}}" },
            { label: "Human-in-the-loop", sub: "approval for irreversible or high-impact actions", tag: "{{5.3}}" },
            { label: "Monitoring and audit", sub: "traces, drift alerts, evidence for regulators", tag: "{{3.4}} {{4.6}}" },
          ],
        } },
        { type: "table",
          head: ["Obligation", "What it changes in the architecture", "Lesson"],
          rows: [
            ["**GDPR**", "Lawful basis, data minimisation, erasure across logs, caches and vector stores, residency", "{{5.4}}"],
            ["**HIPAA**", "A Business Associate Agreement before any PHI, minimum necessary data, audit trail", "{{5.4}}"],
            ["**FedRAMP**", "Federal workloads stay inside an authorised boundary", "{{5.4}}"],
            ["**Bias and fairness**", "Measure outcomes per segment; disclose AI use and offer recourse (transparency)", "{{5.5}}"],
            ["**LLM failure modes**", "Plan for hallucination, prompt injection, data leakage, drift and runaway cost", "{{5.2}}"],
          ] },
      ],
    },
    {
      id: "lifecycle", nav: "The project lifecycle", title: "From first meeting to continuous improvement",
      intro: "The system above does not appear by itself. This is the journey around it, and where each domain does its work.",
      blocks: [
        { type: "diagram", diagram: {
          kind: "flow", title: "The lifecycle",
          steps: [
            { label: "Discovery", sub: "problem, metrics, constraints (D1, D6)", edge: "requirements" },
            { label: "Design", sub: "architecture, models, integration (D1, D2, D3)", edge: "decisions" },
            { label: "Build and evaluate", sub: "evals, safety, team tooling (D4, D5, D7)", edge: "proof" },
            { label: "Handoff", sub: "docs, runbooks, SLAs (D6)", edge: "launch" },
            { label: "Monitor and iterate", sub: "drift, feedback, A/B tests (D3, D4, D6)", tone: "good" },
          ],
          loop: "What production teaches goes back into the eval set and the next design decision",
          caption: "Lessons {{6.5}}, {{6.1}}, {{6.4}} and {{6.3}}.",
        } },
        { type: "table",
          head: ["Domain", "Weight", "The question it answers", "How it connects"],
          rows: [
            ["**1** Solution Design & Architecture", "17%", "What should we build?", "Sets the frame for all the other domains"],
            ["**2** Models, Prompting & Context", "13%", "How does the model perform well?", "Implements the model layer of D1"],
            ["**3** Integration", "19%", "How does it connect, securely and observably?", "Gives D1 its data and actions"],
            ["**4** Evaluation, Testing & Optimization", "16%", "How do we know it works?", "Measures D2 and D3, and justifies changes"],
            ["**5** Governance, Safety & Risk", "14%", "How do we keep it safe and compliant?", "Constrains every design decision"],
            ["**6** Stakeholders & Lifecycle", "14%", "How do people agree and stay aligned?", "Turns D4 results into decisions"],
            ["**7** Developer Productivity & Ops", "7%", "How does the team build and run it?", "Equips the people delivering all of the above"],
          ] },
      ],
    },
    {
      id: "themes", nav: "Every theme at a glance", title: "Every theme at a glance",
      intro: "A one-line definition of each theme, what it connects to, and where to learn it. Come back here whenever a term is unclear.",
      blocks: [
        { type: "themes", families: [
          { name: "Domain 1: designing the solution", items: [
            { term: "Business problem to solution", ids: ["1.1"], what: "Turn a vague ask into a concrete task with a measurable target.", fits: "The starting point of discovery and of every metric." },
            { term: "End-to-end architecture", ids: ["1.2"], what: "Input, processing, validation, output and a feedback loop.", fits: "The skeleton on which every other component sits." },
            { term: "Architectural patterns", ids: ["1.3"], what: "Augmented LLM, workflows (chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer) or agents.", fits: "Sets how much autonomy, cost and risk the system carries." },
            { term: "Multi-agent design", ids: ["1.4"], what: "An orchestrator delegating to subagents with isolated context.", fits: "A pattern to use only when work is truly independent." },
            { term: "Decomposition", ids: ["1.5"], what: "Split a problem by sequence, independent parts or data size.", fits: "Feeds the choice of pattern and of model per step." },
            { term: "Business value alignment", ids: ["1.6"], what: "Tie the solution to efficiency, transformation, productivity, cost or performance SLAs.", fits: "Gives stakeholders the reason to fund it." },
          ] },
          { name: "Domain 2: models, prompts and context", items: [
            { term: "Model selection", ids: ["2.1"], what: "Haiku for volume, Sonnet as the balanced default, Opus for the hardest reasoning.", fits: "Decided by an eval; shapes cost and latency." },
            { term: "System prompts and guardrails", ids: ["2.2"], what: "Role, rules, templates and boundaries in the stable part of the prompt.", fits: "Backed by code wherever a rule must always hold." },
            { term: "Prompting techniques", ids: ["2.3"], what: "Zero-shot, few-shot and chain-of-thought, each used when an eval shows the need.", fits: "The cheapest quality lever before changing tier." },
            { term: "Context window and tokens", ids: ["2.4"], what: "A budget shared by instructions, history, tools, documents and output.", fits: "Limits what RAG and tools can bring in." },
            { term: "Prompt reuse", ids: ["2.5"], what: "Prompt caching, modular prompts and Skills.", fits: "Cuts cost and latency on repeated content." },
          ] },
          { name: "Domain 3: integrating with real systems", items: [
            { term: "Capability bloat", ids: ["3.1"], what: "Remove every tool the role does not need: least privilege.", fits: "Reduces attack surface and tool-selection errors." },
            { term: "AuthN / AuthZ gaps", ids: ["3.2"], what: "Agents act with the user's delegated, scoped credentials.", fits: "Prevents confused-deputy escalation; enables audit." },
            { term: "Accuracy-latency trade-offs", ids: ["3.3"], what: "Each added step must justify its latency with a measured gain.", fits: "Links architecture choices to the SLA." },
            { term: "Observability at scale", ids: ["3.4"], what: "End-to-end traces of every model and tool call.", fits: "The raw data behind monitoring and diagnosis." },
            { term: "RAG pipeline design", ids: ["3.5"], what: "Chunking, contextual retrieval, indexing, hybrid search and reranking.", fits: "Supplies grounded knowledge to the model." },
            { term: "Retrieval strategy", ids: ["3.6"], what: "Lexical, semantic, structured query or full context, by data shape and query pattern.", fits: "Chooses how the RAG pipeline searches." },
            { term: "Integration mechanism", ids: ["3.7"], what: "MCP, direct API/CLI or agent-to-agent (A2A).", fits: "Decides who owns and reuses each connection." },
            { term: "Progressive discovery", ids: ["3.8"], what: "Load names first and details on demand, instead of a monolithic context.", fits: "Protects the context budget as the catalogue grows." },
          ] },
          { name: "Domain 4: evaluating and optimizing", items: [
            { term: "Evaluation metrics", ids: ["4.1"], what: "Accuracy, latency, cost, safety and security, defined before building.", fits: "Becomes the definition of success and of the SLA." },
            { term: "Datasets and frameworks", ids: ["4.2"], what: "Representative, edge and adversarial cases, graded by code, LLM judges and humans.", fits: "The evidence behind every other decision." },
            { term: "A/B testing", ids: ["4.3"], what: "One change at a time, with a pre-defined metric and guard metrics.", fits: "Validates improvements on real traffic." },
            { term: "Diagnosing issues", ids: ["4.4"], what: "Separate prompt failures, hallucinations and model mismatch.", fits: "Turns monitoring signals into targeted fixes." },
            { term: "Cost-performance optimization", ids: ["4.5"], what: "Caching, batching, routing, trimming and output limits.", fits: "Applies the levers without losing eval quality." },
            { term: "Monitoring", ids: ["4.6"], what: "Dashboards, alerts and sampled transcripts in production.", fits: "Detects drift and feeds the next iteration." },
          ] },
          { name: "Domain 5: governing risk", items: [
            { term: "Guardrails", ids: ["5.1"], what: "Layered controls on inputs, tools and outputs.", fits: "The safety net around the request path." },
            { term: "Risks and failure modes", ids: ["5.2"], what: "Hallucination, prompt injection, data leakage, drift and runaway loops.", fits: "Tells you which guardrails and tests you need." },
            { term: "Human-in-the-loop", ids: ["5.3"], what: "People approve high-impact actions; low-risk output is sampled.", fits: "Balances automation with accountability." },
            { term: "Regulatory compliance", ids: ["5.4"], what: "GDPR, HIPAA and FedRAMP turned into architecture controls.", fits: "Constrains data flows, hosting and logging." },
            { term: "Ethical AI", ids: ["5.5"], what: "Measure bias and fairness across segments; be transparent about AI use.", fits: "Adds fairness slices to the eval set." },
          ] },
          { name: "Domain 6: working with stakeholders", items: [
            { term: "Structured discovery", ids: ["6.1"], what: "Users, workflow, metrics, data, constraints and risk tolerance.", fits: "Produces the requirements for the design." },
            { term: "Communicating trade-offs", ids: ["6.2"], what: "Options in business terms, with a clear recommendation.", fits: "Gets architecture decisions accepted." },
            { term: "Feedback loops and SLAs", ids: ["6.3"], what: "A measurable target, a measurement method and a plan for misses.", fits: "Aligns expectations with what evals can prove." },
            { term: "Documentation and guidance", ids: ["6.4"], what: "ADRs, architecture, runbooks, eval reports and known limitations.", fits: "Makes the handoff possible." },
            { term: "Lifecycle phases", ids: ["6.5"], what: "Discovery, design, handoff, monitoring and iteration.", fits: "The timeline that holds all the domains together." },
          ] },
          { name: "Domain 7: enabling developers", items: [
            { term: "Team tooling setup", ids: ["7.1"], what: "Shared Claude Code configuration: CLAUDE.md, settings, permissions, hooks and MCP.", fits: "Encodes team standards where developers work." },
            { term: "AI-assisted workflows", ids: ["7.2"], what: "Plan first, write tests, review independently, keep human approval.", fits: "Speeds up building the system without losing control." },
            { term: "Debugging and operations", ids: ["7.3"], what: "Check context, tools and logs before rewriting the prompt.", fits: "Keeps the delivered system running." },
          ] },
        ] },
        { type: "callout", tag: "Reading order", text: "Lessons follow the exam domains. Start with the business problem {{1.1}}, then the patterns {{1.3}} and evaluation metrics {{4.1}}: most other lessons build on those three." },
      ],
    },
  ],
};

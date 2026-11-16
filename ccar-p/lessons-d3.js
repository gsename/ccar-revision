/* ============================================================================
   CCAR-P lessons — Domain 3: Integration
   One short lesson per objective. Written from tools/facts.md and the public
   Exam Guide v1.0. Schema: see tools/check-lessons.mjs.
   ============================================================================ */
window.CCARP_LESSONS = window.CCARP_LESSONS || [];
window.CCARP_LESSONS.push(
  {
    id: "3.1",
    tldr: "Every tool, scope and credential an agent holds is attack surface and selection noise. Remove what the role does not need before adding approvals or logging.",
    diagram: {
      kind: "layers",
      title: "Strength of a control against capability bloat",
      layers: [
        { label: "Remove the capability", sub: "Drop the tool, narrow the scope, read-only credential", tag: "preventive — wins", tone: "good" },
        { label: "Confirm before use", sub: "Human approval on writes and irreversible actions", tag: "compensating", tone: "warn" },
        { label: "Log and review", sub: "SIEM, transcript audit after the fact", tag: "detective", tone: "warn" },
        { label: "Ask nicely in the prompt", sub: "\"You MUST NEVER…\" — probabilistic, injectable", tag: "not a control", tone: "bad" },
      ],
      caption: "Use lower layers on top of the first, never instead of it.",
    },
    points: [
      "**Capability bloat**: tools, write rights or data fields the role never uses. Each one widens the blast radius of a mistake or a prompt injection.",
      "Enforce in configuration: a `tools` allowlist on the agent or subagent, permission rules such as `Bash(npm test:*)`, and a **read-only credential** so the backend itself refuses writes.",
      "Bloat also hurts accuracy: selection degrades as tools pile up (18+ vs 4–5). Split by stage into **specialised subagents**, each holding only its own tools, under a lean orchestrator.",
      "Trim outputs too: a directory tool that returns every HR field leaks data the task never needed.",
    ],
    traps: [
      { wrong: "Keep the dangerous tools but require an approval click before each use.", right: "Approval is compensating and suffers fatigue; remove the tool when the role never needs it." },
      { wrong: "Longer tool descriptions or a bigger model will fix wrong-tool selection across 22 tools.", right: "Reduce the tools each agent sees; descriptions help only once the set is small." },
      { wrong: "Unattended agents need confirmations to be safe.", right: "Unattended runs cannot wait for a human; narrow the tool set and permission rules instead." },
    ],
    exam: "Rank options preventive > compensating > detective. The answer usually removes a tool, scope or field and backs it with a narrow credential; prompt rules and after-the-fact reviews are distractors.",
    sources: [
      { label: "Subagents (tools allowlist)", url: "https://code.claude.com/docs/en/sub-agents" },
      { label: "Writing tools for agents", url: "https://www.anthropic.com/engineering/writing-tools-for-agents" },
    ],
  },
  {
    id: "3.2",
    tldr: "An agent acting for a user must act with that user's delegated, scoped identity. A shared admin key makes the agent a confused deputy and erases the per-user audit trail.",
    diagram: {
      kind: "compare",
      title: "Whose identity reaches the downstream system?",
      columns: [
        { title: "Shared service key", tone: "bad", items: [
          "One admin account for thousands of users",
          "Any user can reach anything the key can (confused deputy)",
          "Logs show only the service account",
          "Token often hardcoded in config or git",
        ] },
        { title: "Delegated user credentials", tone: "good", items: [
          "OAuth on-behalf-of, scoped to the task",
          "Downstream ACLs enforce what this user may see",
          "Every call carries the end-user identity: per-user audit",
          "Secrets in a vault or `${VAR}`, never in prompts or git",
        ] },
      ],
      caption: "Authentication proves who; authorisation must still be decided by the system of record, per user.",
    },
    points: [
      "**Confused deputy**: a privileged agent performs an action for a user who could not do it directly. The fix is identity, not a better prompt.",
      "**Permission-aware retrieval**: filter RAG results by the end user's ACL **at query time**, not at index time and not by the agent's identity, so changing permissions apply instantly.",
      "Credentials in `.mcp.json`: use `${VAR}` expansion so each engineer supplies their own token and no secret is committed.",
      "**Prompt injection** is an authorisation problem too: content read from email or the web is data. Separate privileges and put a **human approval gate** on irreversible actions like payments.",
    ],
    traps: [
      { wrong: "Tell the agent in the system prompt not to reveal confidential sites.", right: "Use the user's own credentials so the store never returns what the user cannot open." },
      { wrong: "Block injection with a regex list of phrases like \"ignore prior rules\".", right: "Isolate privileges and gate high-impact tools; attackers rephrase around blocklists." },
      { wrong: "Re-index nightly with each user's permissions baked into the chunks.", right: "Apply the ACL filter at query time; walls that change hourly would go stale." },
    ],
    exam: "If a scenario shows one service account, missing user identity in logs, or data leaking across roles, pick delegated user-scoped credentials plus query-time authorisation.",
    sources: [
      { label: "Claude Code MCP (env expansion)", url: "https://code.claude.com/docs/en/mcp" },
      { label: "Mitigate jailbreaks and prompt injection", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks" },
    ],
  },
  {
    id: "3.3",
    tldr: "Every accuracy-for-latency trade must be justified against stated thresholds and eval numbers. Meet the hard constraint first, then take the most accuracy that still fits.",
    diagram: {
      kind: "decision",
      title: "Which lever fits the constraint?",
      question: "What does the scenario actually fail on?",
      branches: [
        { when: "Hard latency budget missed", then: "Route easy sub-tasks to a faster tier; drop steps that break the budget", tone: "good" },
        { when: "Accuracy only, no latency limit", then: "Chain prompts, raise effort, use a stronger tier", tone: "good" },
        { when: "SLA met but users feel it hangs", then: "Stream the output — perceived latency, same quality", tone: "accent" },
        { when: "Repeated long prefix is slow and costly", then: "Prompt caching — cost and TTFT, never accuracy", tone: "warn" },
      ],
    },
    points: [
      "**Model tier routing**: use the fastest tier where evals show parity (e.g. intent classification) and keep the stronger tier only for the hard sub-task.",
      "**Effort / thinking** buy quality with latency and cost. If evals show medium effort within a point of high, the extra seconds are not justified. A fixed `budget_tokens` is the older mechanism.",
      "**Prompt chaining** adds latency but gives each step one focused job; take that trade when accuracy is the only criterion.",
      "A component that improves accuracy (e.g. a reranker) is still dropped if the pipeline already clears the accuracy floor and only its removal meets the latency budget.",
      "**Caching** cuts input cost and time-to-first-token; it does not change what the model generates.",
    ],
    traps: [
      { wrong: "Caching the document will reduce the factual-error rate.", right: "Caching stores prefix state, not knowledge; accuracy stays the same." },
      { wrong: "Users say it hangs, so switch to the fastest tier.", right: "If the SLA is met, stream the output and keep the accuracy you have." },
      { wrong: "The reranker adds three points, so keep it whatever the cost.", right: "Above the floor, the latency constraint decides; justify with the numbers." },
    ],
    exam: "Read the thresholds first (p95, floor, SLA). The correct option meets every stated constraint with eval evidence; options that maximise one metric while breaking another are distractors.",
    sources: [
      { label: "Choosing a model", url: "https://platform.claude.com/docs/en/about-claude/models/choosing-a-model" },
      { label: "Prompt caching", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-caching" },
    ],
  },
  {
    id: "3.4",
    tldr: "At scale you cannot read transcripts: trace each session end to end, put structured fields on every call, segment the metrics, and redact before you store.",
    diagram: {
      kind: "hub",
      title: "One trace per session, one span per step",
      center: { label: "End-to-end trace", sub: "OpenTelemetry: each model and tool call is a span" },
      spokes: [
        { label: "request_id + session id", sub: "find one failing session fast", tone: "good" },
        { label: "Prompt and model version", sub: "tie a regression to a release", tone: "good" },
        { label: "Tokens: input / cache read / cache write / output", sub: "explain a cost jump in hours", tone: "good" },
        { label: "stop_reason + tool calls + latency", sub: "see which step failed and how", tone: "good" },
        { label: "Segment tags (language, tenant, product)", sub: "surface slices the average hides", tone: "accent" },
        { label: "Redacted at write time, retention set", sub: "PII and secrets never stored raw", tone: "warn" },
      ],
    },
    points: [
      "Logging only input and final output cannot show which of 40 steps failed. **Tracing** each call as a span can.",
      "**Token breakdown per request and prompt version** answers cost questions directly: a cache-read drop after a release means the prefix changed.",
      "**Aggregate metrics hide segment failures**: a 4% language slice can collapse while the global score holds. Segment dashboards and drift alerts.",
      "**GDPR and observability coexist**: redact at write time, set retention, sample transcripts for review. Never log API keys.",
      "Claude Code can **export OpenTelemetry** metrics and events to an existing collector, with no developer action.",
    ],
    traps: [
      { wrong: "Keep every raw transcript forever so any session can be replayed.", right: "Unsearchable at volume and breaks data minimisation; trace structured fields and sample redacted transcripts." },
      { wrong: "Turn logging off for regulated data.", right: "That blinds QA; redact, restrict retention and sample instead." },
    ],
    exam: "Pick the option that adds structured, per-call fields (request ID, version, token split, stop_reason) or segmentation. Weekly eyeballing, monthly invoices and bigger global samples are distractors.",
    sources: [
      { label: "Claude Code monitoring (OpenTelemetry)", url: "https://code.claude.com/docs/en/monitoring-usage" },
      { label: "Define success criteria", url: "https://platform.claude.com/docs/en/test-and-evaluate/define-success" },
    ],
  },
  {
    id: "3.5",
    tldr: "Chunk along the document's own structure, give each chunk its context before indexing, retrieve hybrid then rerank, and evaluate retrieval separately from generation.",
    diagram: {
      kind: "flow",
      title: "A RAG pipeline that holds up",
      steps: [
        { label: "Chunk by structure", sub: "headings, sections, procedures; small overlap", edge: "context prepended" },
        { label: "Contextualise + index", sub: "same chunk into embeddings and BM25; one embedding model", edge: "query" },
        { label: "Hybrid retrieve", sub: "lexical + semantic, metadata filters", edge: "top-k" },
        { label: "Rerank", sub: "keep the best few for the context budget", edge: "grounded" },
        { label: "Generate with citations", sub: "answer only from retrieved passages", tone: "good" },
      ],
      loop: "Corpus changes → incremental re-index",
      caption: "Below roughly 200K tokens, skip the pipeline: put the corpus in the prompt and cache it.",
    },
    points: [
      "**Chunk size**: too small loses context and splits procedures; too large dilutes relevance and costs tokens. Structure beats fixed 512-token windows for manuals and reports.",
      "**Contextual retrieval**: prepend a short chunk-specific context (company, period, section) before embedding and BM25. It fixes chunks that do not name what they are about.",
      "The **same embedding model** must embed queries and documents; changing it means re-embedding the corpus.",
      "**Freshness**: update the index on change events, incrementally, rather than full nightly rebuilds.",
      "**Evaluate in two parts**: recall@k on labelled passages for retrieval, faithfulness and correctness for generation. Fix retrieval before rewording prompts.",
    ],
    traps: [
      { wrong: "A reranker will fix chunks that never mention the company or year.", right: "A reranker only reorders; add the missing context to the chunk before indexing." },
      { wrong: "Answers are wrong, so keep rewording the generation prompt.", right: "Measure recall@k first; the model cannot use a passage it never received." },
      { wrong: "Every corpus needs a vector database.", right: "A small, stable knowledge base fits in a cached prompt with nothing to operate." },
    ],
    exam: "Locate the failing stage: split facts → chunking; chunk lacks identity → contextual retrieval; stale answers → re-index; unclear → evaluate retrieval separately.",
    sources: [
      { label: "Contextual retrieval", url: "https://www.anthropic.com/news/contextual-retrieval" },
      { label: "Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations" },
    ],
  },
  {
    id: "3.6",
    tldr: "There is no single best retriever. Match the strategy to the shape of the data and the shape of the question: exact codes, attributes, aggregates, relationships or meaning.",
    diagram: {
      kind: "decision",
      title: "Match strategy to data and query",
      question: "What does the question need from the data?",
      branches: [
        { when: "Exact IDs, error codes, part numbers", then: "Hybrid: BM25 lexical + semantic", tone: "good" },
        { when: "Attributes: date, jurisdiction, tenant", then: "Metadata filters before similarity ranking", tone: "good" },
        { when: "Totals, counts, filters over tables", then: "Structured query (SQL) — the database does the maths", tone: "good" },
        { when: "Direct or transitive relationships", then: "Graph traversal over the edges", tone: "good" },
      ],
      caption: "Paraphrased natural-language questions over prose: semantic search, then rerank.",
    },
    table: {
      head: ["Symptom", "Fix"],
      rows: [
        ["Neighbouring codes returned as matches", "Add BM25 (hybrid search)"],
        ["Wrong country or year near the top", "Metadata filter, not reranking"],
        ["Right passage in top 20, not top 5", "Rerank the top 20 down to 5"],
        ["Small style guide every reply needs", "Put it in a cached prompt, no retrieval"],
      ],
    },
    points: [
      "**Embeddings blur exact tokens**: `E-4471` and `E-4417` look alike semantically. Lexical BM25 matches them exactly.",
      "**Filters are cheap and exact**; apply them before ranking instead of asking the model to ignore wrong results in the prompt.",
      "**Similarity search cannot aggregate**: embedding table rows returns look-alike rows, never a correct sum.",
      "A **reranker** helps when recall is fine but ordering is poor, provided the latency budget has room.",
    ],
    traps: [
      { wrong: "Embed the ledger rows so one RAG pipeline serves every source.", right: "Tabular questions need SQL; give each source the strategy its shape needs." },
      { wrong: "Raise the similarity threshold to stop near-miss codes.", right: "Embeddings still treat the codes as near-identical; add lexical matching." },
    ],
    exam: "Name the data shape in the stem (codes, attributes, table, graph, small doc), then pick the matching strategy. \"One pure-vector pipeline for everything\" is the outdated distractor.",
    sources: [
      { label: "Contextual retrieval (hybrid + rerank)", url: "https://www.anthropic.com/news/contextual-retrieval" },
      { label: "Effective context engineering", url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" },
    ],
  },
  {
    id: "3.7",
    tldr: "MCP shares tools and context across hosts, a direct API or CLI is simplest for one narrow integration, and agent-to-agent (A2A) is for delegating to a peer agent that reasons on its own.",
    diagram: {
      kind: "compare",
      title: "Three integration mechanisms",
      columns: [
        { title: "MCP", items: [
          "Gives a model tools, resources, prompts",
          "Reused by many hosts; one team owns and versions it",
          "stdio for local, Streamable HTTP for remote",
          "Community server for Jira, GitHub; custom for in-house",
        ] },
        { title: "Direct API / CLI", items: [
          "One app owns a narrow integration",
          "CLI already exists (`gh`, `aws`) — agents use CLIs well",
          "No protocol layer to host or maintain",
        ] },
        { title: "Agent-to-agent (A2A)", items: [
          "Peer agent with its own tools and reasoning",
          "Often another organisation or vendor",
          "Discovery via agent cards, then task delegation",
          "Not a way to give a model tool access",
        ] },
      ],
    },
    points: [
      "Choose by **who reuses it**: several hosts or teams → MCP; one job, one owner → API or CLI; another agent that decides for itself → A2A.",
      "MCP server features: **tools** are model-controlled actions, **resources** are application-driven read-only content addressed by URIs (catalogues, schemas), **prompts** are user-invoked templates.",
      "Transports: **stdio** when the client launches the server on the same machine; **Streamable HTTP** for a shared remote server. HTTP+SSE is deprecated.",
      "Prefer an existing or community MCP server for standard systems; write a custom one for in-house workflows several hosts share, with secrets via `${VAR}`.",
    ],
    traps: [
      { wrong: "MCP is the standard, so build an MCP server even for one nightly job.", right: "With one owner and an existing CLI, call the CLI; there is no reuse to justify a server." },
      { wrong: "Wrap the supplier's agent as an MCP tool.", right: "A peer that plans and reasons is an A2A delegation, not a tool call." },
      { wrong: "Use SSE for a remote MCP server.", right: "Streamable HTTP is the current remote transport; SSE is deprecated." },
    ],
    exam: "Count the hosts and owners in the stem. Many hosts or central ownership → MCP; single narrow use with a CLI → CLI; cross-organisation autonomous agent → A2A.",
    sources: [
      { label: "MCP tools specification", url: "https://modelcontextprotocol.io/specification/2025-06-18/server/tools" },
      { label: "MCP transports", url: "https://modelcontextprotocol.io/specification/2025-06-18/basic/transports" },
      { label: "A2A protocol", url: "https://a2a-protocol.org/latest/" },
    ],
  },
  {
    id: "3.8",
    tldr: "Progressive discovery loads names and descriptions first and the details only when needed. It wins for large catalogues that are mostly irrelevant per request; a small, always-used set stays monolithic and cached.",
    diagram: {
      kind: "flow",
      title: "Progressive discovery",
      steps: [
        { label: "Index only", sub: "names + short descriptions in context", edge: "request arrives" },
        { label: "Discover", sub: "tool search, skill matching, resource listing", edge: "match" },
        { label: "Load on demand", sub: "full schema, skill body or rule enters context", tone: "good" },
      ],
      caption: "Monolithic: every schema and document in every prompt. Fine only when small, always needed and cacheable.",
    },
    table: {
      head: ["Mechanism", "What loads up front", "What loads on demand"],
      rows: [
        ["Tool search", "Search tool + some tools", "Tools marked `defer_loading: true`"],
        ["Skills", "Name + description", "`SKILL.md` body when invoked or relevant"],
        ["Path-scoped rules", "Nothing for that area", "`.claude/rules/` file when matching paths are touched"],
        ["MCP resources", "Resource list", "Resource content by URI"],
      ],
    },
    points: [
      "Progressive discovery saves tokens **and** improves selection: fewer schemas compete for attention.",
      "Tool search needs the search tool, and at least one tool, **not** deferred. Deferring everything leaves nothing to discover with.",
      "Procedures pasted into CLAUDE.md, or pulled in via `@path` imports, load at launch. Move them to **Skills** or **path-scoped rules**.",
      "Six tools that nearly every request uses: keep them monolithic and cached. A discovery step would only add latency.",
    ],
    traps: [
      { wrong: "Cache the 120 tool schemas and the problem is solved.", right: "Caching cuts cost, but all 120 still compete for selection; defer them." },
      { wrong: "A bigger context window makes monolithic context fine.", right: "More room does not cure attention dilution or selection noise." },
    ],
    exam: "Large catalogue, few used per request → progressive (tool search, Skills, scoped rules). Small catalogue, always used, latency-critical → monolithic + caching.",
    sources: [
      { label: "Tool search tool", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool" },
      { label: "Agent Skills overview", url: "https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview" },
      { label: "Claude Code memory and rules", url: "https://code.claude.com/docs/en/memory" },
    ],
  },
);

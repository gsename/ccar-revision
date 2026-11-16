/* ============================================================================
   CCAR-F lessons — Domain 2: Tool Design & MCP Integration
   One short lesson per task statement. Written from tools/facts.md and the
   public Exam Guide v1.0. Schema: see tools/check-lessons.mjs.
   ============================================================================ */
window.CCARF_LESSONS = window.CCARF_LESSONS || [];
window.CCARF_LESSONS.push(
  {
    id: "2.1",
    tldr: "Claude picks a tool mainly from its name and description. Make each description say what, when, inputs and when NOT to use it, so no two tools look alike.",
    diagram: {
      kind: "compare",
      title: "Two tools, one request",
      columns: [
        {
          title: "Overlapping → misrouting",
          tone: "bad",
          items: [
            "`analyze_content`: \"Analyzes content and returns findings.\"",
            "`analyze_document`: \"Analyzes content and returns findings.\"",
            "Model guesses; web results land in the document tool",
          ],
        },
        {
          title: "Differentiated → reliable choice",
          tone: "good",
          items: [
            "`extract_web_results`: web search hits only; returns title, URL, snippet",
            "`summarize_content`: one long document → 5-bullet summary",
            "Each says \"use this when…, not for…\" and names its sibling",
          ],
        },
      ],
      caption: "If a human could not tell the tools apart from their descriptions, neither can the model.",
    },
    points: [
      "The **description is the primary selection signal**. A one-line description is fine for a unique tool, unreliable among similar ones.",
      "A good description covers **purpose, input format** (e.g. `order_id` like `ORD-12345`, amount as a number), **example queries, edge cases** and the **boundary** with the nearest alternative.",
      "Fix overlap by **renaming** (`analyze_content` → `extract_web_results`) and rewriting both descriptions so their scopes do not intersect.",
      "Split a **generic tool** with a free-text instruction into **purpose-specific tools** with clear input/output contracts: `extract_data_points`, `summarize_content`, `verify_claim_against_source`.",
      "The **system prompt can override** good descriptions: a keyword rule such as \"if the customer says complaint, involve a human\" creates a tool association that fires on the word, not the need.",
    ],
    traps: [
      { wrong: "Wrong tool picked → move to a bigger model or add a routing classifier.", right: "First fix the descriptions and names; that is the cheapest, root-cause fix." },
      { wrong: "Put the \"which tool when\" rule only in one agent's system prompt.", right: "Put it in the tool descriptions, so every agent that receives the tool gets the rule." },
      { wrong: "Descriptions were rewritten and misrouting persists → descriptions are still too short.", right: "Check the system prompt for keyword-triggered instructions that override them." },
    ],
    exam: "Misrouting between similar tools: the answer improves names and descriptions (or splits the tool). Bigger models, classifiers and few-shot examples come after.",
    sources: [
      { label: "Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools" },
      { label: "Writing tools for agents", url: "https://www.anthropic.com/engineering/writing-tools-for-agents" },
    ],
  },
  {
    id: "2.2",
    tldr: "A failed MCP tool returns a normal result with `isError: true` plus structured metadata (category, retryable, message), so the agent can choose the right recovery instead of guessing.",
    diagram: {
      kind: "decision",
      title: "Error category → what the agent should do",
      question: "Why did the tool call fail?",
      branches: [
        { when: "Transient: timeout, 503, 429", then: "Retry (with backoff) — `isRetryable: true`", tone: "good" },
        { when: "Validation: bad input (start date after end date)", then: "Fix the arguments, then call again" },
        { when: "Business: policy violation (refund after 30 days)", then: "Do not retry — explain the rule to the customer", tone: "warn" },
        { when: "Permission: access refused", then: "Do not retry — escalate or request access", tone: "warn" },
      ],
      caption: "Unknown tool or malformed request = JSON-RPC protocol error. A tool that ran and failed = `isError: true` result.",
    },
    points: [
      "**`isError: true`** puts the failure in the result the model reads, so it can reason about it. Protocol errors are for unknown tools and malformed requests.",
      "Return **`errorCategory`**, **`isRetryable`** and a **human-readable message**. A generic \"Operation failed\" makes the agent retry policy refusals and give up on transient blips.",
      "Business errors need `isRetryable: false` and a **customer-friendly explanation** the agent can relay.",
      "**Empty is not failure**: \"0 matches\" is a successful query. Returning `[]` on a timeout makes the agent tell customers they have no account.",
      "Subagents **retry transient errors locally**; only unresolvable errors go to the coordinator, with what was attempted and any partial results.",
    ],
    code: "{\n  \"isError\": true,\n  \"content\": [{ \"type\": \"text\", \"text\": \"Refund window is 30 days; this order was delivered 45 days ago.\" }],\n  \"structuredContent\": { \"errorCategory\": \"business\", \"isRetryable\": false }\n}",
    traps: [
      { wrong: "Retry every failure three times to be safe.", right: "Retry only transient errors; validation, business and permission errors will fail again." },
      { wrong: "Return an empty list when the backend is unreachable.", right: "Return an explicit access failure; reserve empty results for real \"no matches\"." },
    ],
    exam: "Pick the option where the error carries a category and a retryable flag, and where empty results are distinguished from failures. \"Generic message\" and \"retry everything\" are distractors.",
    sources: [
      { label: "MCP spec — tools (error handling)", url: "https://modelcontextprotocol.io/specification/2025-06-18/server/tools" },
      { label: "Writing tools for agents", url: "https://www.anthropic.com/engineering/writing-tools-for-agents" },
    ],
  },
  {
    id: "2.3",
    tldr: "Give each agent only the 4–5 tools its role needs; more tools mean worse selection and cross-role misuse. Use `tool_choice` to control whether, and which, tool must be called.",
    diagram: {
      kind: "hub",
      title: "Scoped tool sets per role",
      center: { label: "Coordinator", sub: "`Agent` tool (formerly `Task`) + routing" },
      spokes: [
        { label: "Search subagent", sub: "`web_search`, `load_document`", tone: "good" },
        { label: "Analysis subagent", sub: "`extract_data_points`, `summarize_content`", tone: "good" },
        { label: "Synthesis subagent", sub: "no search — only a scoped `verify_fact`", tone: "accent" },
      ],
      caption: "Complex cross-role needs go back through the coordinator, not into every agent's tool list.",
    },
    points: [
      "**Too many tools** (18 instead of 4–5) increases decision complexity and degrades selection, even on simple requests.",
      "An agent holding tools **outside its role** uses them: a synthesis agent with web search starts searching mid-synthesis.",
      "Allow a narrow **cross-role tool** for a high-frequency need (`verify_fact`); route anything bigger through the coordinator.",
      "Replace generic tools with **constrained ones**: `load_document` that validates document URLs instead of an open `fetch_url`.",
      "**Forced tool choice** is rejected (400) with manual extended thinking and on the newest tiers; current docs prefer `output_config.format` or `strict: true` tools for structured output.",
    ],
    table: {
      head: ["`tool_choice`", "Effect", "Use it to"],
      rows: [
        ["`auto` (default)", "May call a tool or answer in text", "Chat that sometimes needs data"],
        ["`any`", "Must call some tool", "Never get prose instead of a tool call"],
        ["`{type: \"tool\", name}`", "Must call that tool", "Force a first step (e.g. `extract_metadata`), then `auto` in later turns"],
        ["`none`", "No tool call, tools stay defined", "A final plain-text step"],
      ],
    },
    traps: [
      { wrong: "Give every agent all tools to \"future-proof\" it.", right: "Scope tools per role; add tools only when a role needs them." },
      { wrong: "Force a tool on every turn to enforce an order.", right: "Force it on the first turn only, then let follow-up turns run on `auto`." },
    ],
    exam: "Selection errors after adding tools → reduce and scope the set. \"Must not answer in prose\" → `any`. \"This tool first\" → forced tool, first turn only.",
    sources: [
      { label: "Implement tool use (tool_choice)", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use" },
      { label: "Subagents in the SDK", url: "https://code.claude.com/docs/en/agent-sdk/subagents" },
    ],
  },
  {
    id: "2.4",
    tldr: "Team servers go in the committed `.mcp.json` with `${VAR}` for secrets; personal ones in user scope. All servers' tools load together, so describe them well — and expose catalogs as resources.",
    diagram: {
      kind: "layers",
      title: "Claude Code MCP scopes (precedence top → bottom)",
      layers: [
        { label: "Local (default)", sub: "this project, only you — stored in `~/.claude.json`", tag: "wins" },
        { label: "Project — `.mcp.json` at repo root", sub: "committed; the whole team gets it; asks for approval", tag: "shared", tone: "accent" },
        { label: "User", sub: "`~/.claude.json`, all your projects — personal or experimental", tone: "good" },
      ],
      caption: "Same server name in two scopes: the higher one is used, configs are not merged.",
    },
    points: [
      "**Project scope** = shared team tooling, version-controlled. **User scope** = a personal or experimental server in every project, invisible to teammates.",
      "**`${VAR}` / `${VAR:-default}` expansion** in `.mcp.json` keeps tokens out of git. If the variable is unset (e.g. in CI), the server fails to authenticate.",
      "Interactive sessions **ask for approval** of project servers (`/mcp` shows it pending); `-p` and SDK runs load them without asking.",
      "Tools from **all configured servers** are discovered at connection and available **at once** — a new server's tools reach every agent sharing that config unless you scope them.",
      "**Resources** expose catalogs (issue summaries, doc trees, DB schemas) so the agent sees what exists without exploratory tool calls. Prefer a **community server** for standard systems (Jira, GitHub); build custom only for team-specific workflows.",
    ],
    code: "// .mcp.json — committed\n{\n  \"mcpServers\": {\n    \"github\": {\n      \"type\": \"http\",\n      \"url\": \"${GITHUB_MCP_URL:-https://mcp.example.com/github}\",\n      \"headers\": { \"Authorization\": \"Bearer ${GITHUB_TOKEN}\" }\n    }\n  }\n}",
    traps: [
      { wrong: "Hardcode the token in `.mcp.json` because the repo is private.", right: "Use `${GITHUB_TOKEN}`; each developer and CI sets the variable." },
      { wrong: "The agent prefers Grep over a better MCP tool → remove Grep.", right: "Enrich the MCP tool's description with its capabilities and outputs." },
      { wrong: "Write a custom MCP server for Jira.", right: "Use the existing server; spend custom effort on your internal workflow." },
    ],
    exam: "\"Whole team, no secret in git\" → `.mcp.json` + `${VAR}`. \"Just me, every project\" → user scope. \"Agent explores to find what exists\" → MCP resources.",
    sources: [
      { label: "Claude Code — MCP", url: "https://code.claude.com/docs/en/mcp" },
      { label: "MCP spec — resources", url: "https://modelcontextprotocol.io/specification/2025-06-18/server/resources" },
    ],
  },
  {
    id: "2.5",
    tldr: "Glob finds files by name, Grep finds text inside files, Read loads one file, Edit changes a unique snippet. Explore incrementally: search first, then read only what the search points to.",
    diagram: {
      kind: "flow",
      title: "Incremental codebase understanding",
      steps: [
        { label: "Glob or Grep", sub: "locate files (name) or entry points (content)", tone: "accent", edge: "few hits" },
        { label: "Read those files", sub: "follow imports to trace the flow", edge: "target found" },
        { label: "Edit", sub: "replace a unique anchor string", tone: "good", edge: "not unique?" },
        { label: "Read + Write", sub: "fallback: load the whole file, write it back", tone: "warn" },
      ],
      caption: "Never read the whole repository upfront: it burns context and turns.",
    },
    points: [
      "**Glob** = file path patterns: `**/*.test.tsx`, `reports/2023/*.md`. It does not look inside files.",
      "**Grep** = content search: callers of a function, where an error message is raised, import statements.",
      "**Edit** needs **unique** anchor text. When the target is not unique and no larger unique context exists, **Read** the full file and **Write** the corrected version.",
      "Wrapper modules hide usage: first find **every exported alias** (`fmt`, `toDisplayDate`), then Grep for each name across the codebase.",
      "Combine them: Glob narrows the file set, Grep searches inside it — cheaper than reading thousands of files.",
    ],
    traps: [
      { wrong: "Use Grep to find files named `*.test.tsx`.", right: "That is a name pattern → Glob." },
      { wrong: "Read every file to understand the system before answering.", right: "Grep for entry points, then Read and follow imports only where needed." },
      { wrong: "Edit failed → retry Edit with the same text.", right: "Non-unique match → Read + Write fallback." },
    ],
    exam: "Name or extension pattern → Glob. Text inside files → Grep. Edit not unique → Read + Write. Options that read everything upfront are wrong.",
    sources: [
      { label: "Agent SDK overview (built-in tools)", url: "https://code.claude.com/docs/en/agent-sdk/overview" },
      { label: "Common workflows", url: "https://code.claude.com/docs/en/common-workflows" },
    ],
  },
);

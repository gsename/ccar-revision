/* ============================================================================
   CCAR-F — "Big picture": the course-wide map shown before the lessons.
   Introduces every theme of the course and how the parts fit together.
   {{1.5}} renders as a link to lesson 1.5. Checked by tools/check-lessons.mjs:
   every lesson must be linked from here, and every required theme must appear.
   ============================================================================ */
window.CCARF_OVERVIEW = {
  title: "The big picture",
  teaser: "Every theme of the course on one map: the loop, tools, MCP, hooks, subagents, the SDK, Claude Code, and how they fit together.",
  lead: "Read this first. The course has 30 lessons, but they all describe **one system**. This page shows the whole system, what each part is for and how the parts connect, so each lesson lands in a place you already know. Every numbered tag opens its lesson.",
  sections: [
    {
      id: "map", nav: "The whole map", title: "The whole map on one page",
      intro: "At the centre, a **harness** runs an **agentic loop** around a **Claude model**. Every other theme does one of four things to that loop: **feeds** it (context), **extends** it (tools), **controls** it (hooks, gates, permissions) or **multiplies** it (subagents).",
      blocks: [
        { type: "diagram", diagram: {
          kind: "nest", title: "Everything in the course, nested",
          nodes: [
            { label: "Who starts the agent", sub: "the entry points", children: [
              { label: "A developer", sub: "Claude Code in a terminal or IDE", id: "3.4" },
              { label: "A CI pipeline", sub: "`claude -p` on every pull request", id: "3.6" },
              { label: "Your application", sub: "the Claude Agent SDK in your code", id: "1.1" },
            ] },
            { arrow: "all three run the same harness" },
            { label: "The harness", sub: "the program that runs the agent: Claude Code and the Agent SDK share it", children: [
              { label: "Feeds it: context", sub: "what the model knows", col: true, grow: 1, children: [
                { label: "CLAUDE.md", sub: "always-loaded instructions", id: "3.1" },
                { label: "Path rules", sub: "load for matching files", id: "3.3" },
                { label: "Skills, slash commands", sub: "load on demand", id: "3.2" },
                { label: "Case facts, trimming", sub: "keep what matters", id: "5.1" },
                { label: "Sessions", sub: "resume, fork", id: "1.7" },
              ] },
              { label: "The agentic loop", sub: "repeats until `stop_reason` is `end_turn`", col: true, grow: 1, tone: "accent", children: [
                { label: "Messages API + Claude", sub: "`tool_use` → run tools → `tool_result` → again", id: "1.1", tone: "accent" },
                { label: "Explicit criteria", sub: "say exactly what to report", id: "4.1" },
                { label: "Few-shot examples", sub: "show the judgement", id: "4.2" },
                { label: "Structured output", sub: "JSON schema, `tool_choice`", id: "4.3" },
                { label: "Validation and retry", sub: "check meaning in code", id: "4.4" },
              ] },
              { label: "Extends it: tools", sub: "what the model can do", col: true, grow: 1, children: [
                { label: "Tool design", sub: "the description drives the choice", id: "2.1" },
                { label: "Built-in tools", sub: "Read, Edit, Bash, Grep, Glob", id: "2.5" },
                { label: "MCP servers", sub: "tools and resources from outside", id: "2.4" },
                { label: "Structured errors", sub: "`isError`, category, retryable", id: "2.2" },
                { label: "Tool scoping", sub: "few tools per agent", id: "2.3" },
              ] },
            ] },
            { label: "Controls it", sub: "guarantees enforced by code, around the loop", tone: "warn", children: [
              { label: "Hooks", sub: "`PreToolUse`, `PostToolUse`", id: "1.5" },
              { label: "Prerequisite gates", sub: "verify, then refund", id: "1.4" },
              { label: "Plan mode", sub: "explore before editing", id: "3.4" },
            ] },
            { arrow: "when one agent is not enough, or a human must decide" },
            { label: "Beyond a single loop", sub: "other agents and people", children: [
              { label: "Coordinator + subagents", sub: "hub-and-spoke orchestration", id: "1.2" },
              { label: "Spawning, context passing", sub: "the `Agent` tool (formerly `Task`)", id: "1.3" },
              { label: "Task decomposition", sub: "fixed chain or adaptive plan", id: "1.6" },
              { label: "Error propagation", sub: "what subagents report back", id: "5.3" },
              { label: "Provenance", sub: "claims keep their sources", id: "5.6" },
              { label: "Large codebases", sub: "scratchpads, `/compact`", id: "5.4" },
              { label: "Escalation", sub: "when to hand to a human", id: "5.2" },
              { label: "Human review", sub: "confidence, sampling", id: "5.5" },
              { label: "Iterative refinement", sub: "examples, tests, interview", id: "3.5" },
              { label: "Batch processing", sub: "latency-tolerant volume", id: "4.5" },
              { label: "Multi-pass review", sub: "independent instances", id: "4.6" },
            ] },
          ],
        } },
        { type: "callout", tag: "Keep this sentence in mind", text: "**The model only decides. The harness executes.** Claude never runs a tool itself: it asks, and code runs the tool, applies hooks and returns the result. That is why a hook is a guarantee and a prompt is only a request." },
      ],
    },
    {
      id: "stack", nav: "API, SDK, Claude Code", title: "API, Agent SDK, Claude Code: three levels of the same thing",
      intro: "These names are often confused. They are **layers**: each one is built on the one below it. Going down gives you more control and more code to own.",
      blocks: [
        { type: "diagram", diagram: {
          kind: "layers", title: "From product to model",
          layers: [
            { label: "Claude Code", sub: "the harness as a ready-made product: terminal, IDE, `claude -p` in CI", tag: "use it", tone: "accent" },
            { label: "Claude Agent SDK", sub: "the same harness as a library, in Python or TypeScript (formerly the Claude Code SDK)", tag: "embed it", tone: "accent" },
            { label: "The harness", sub: "agentic loop, built-in tools, hooks, sessions, subagents, permissions, CLAUDE.md, skills", tag: "shared by both" },
            { label: "Messages API", sub: "one stateless endpoint: messages, tools, `tool_choice`, `stop_reason`, structured outputs, batches", tag: "you write the loop" },
            { label: "Claude model", sub: "reads the context and chooses the next step; executes nothing itself", tag: "decides" },
          ],
        } },
        { type: "table",
          head: ["If you need…", "Use", "Lessons"],
          rows: [
            ["A developer working in a repository", "**Claude Code**, configured with CLAUDE.md, rules and skills", "{{3.1}} {{3.2}} {{3.3}} {{3.4}}"],
            ["Automated review or tests on each pull request", "**Claude Code** in non-interactive mode: `claude -p`", "{{3.6}}"],
            ["An agent inside your own product", "**Claude Agent SDK**: hooks, subagents and sessions come built in", "{{1.1}} {{1.5}} {{1.7}}"],
            ["One extraction per document, no loop needed", "**Messages API** with a JSON schema, or the **Message Batches API** for volume", "{{4.3}} {{4.5}}"],
          ] },
      ],
    },
    {
      id: "trace", nav: "One request, step by step", title: "One request, from start to finish",
      intro: "Here is every part at work in a single request: a customer asks a support agent for a refund. Follow the numbers, and watch who acts at each step.",
      blocks: [
        { type: "diagram", diagram: {
          kind: "trace",
          steps: [
            { who: "Harness", title: "The session starts", text: "It assembles the context: system prompt, CLAUDE.md {{3.1}}, matching rules {{3.3}}, skill descriptions {{3.2}} and the tool list from every MCP server {{2.4}}." },
            { who: "Harness", title: "First call to the Messages API", text: "It sends the customer's message, the history and the tool definitions. The API is stateless, so everything is resent on each turn {{1.1}}." },
            { who: "Claude", tone: "accent", title: "Claude picks a tool", text: "It reads the tool descriptions {{2.1}} and answers with a `tool_use` block for `get_customer`. The `stop_reason` is `tool_use`, so the loop continues." },
            { who: "Hook", tone: "warn", title: "`PreToolUse` checks the call", text: "Code inspects the request before it runs and can allow or deny it {{1.5}}. A prerequisite gate blocks `process_refund` until identity is verified {{1.4}}." },
            { who: "Tool", tone: "good", title: "The tool runs", text: "An MCP server calls the backend {{2.4}}. On failure it returns `isError` with a category and a retryable flag, so Claude can react sensibly {{2.2}}." },
            { who: "Hook", tone: "warn", title: "`PostToolUse` cleans the result", text: "Code normalises formats before the model reads them {{1.5}}, and verbose output is trimmed so it does not fill the context {{5.1}}." },
            { who: "Harness", title: "The result goes back, and the loop repeats", text: "The `tool_result` joins the history and Claude is called again with what it just learned {{1.1}}." },
            { who: "Claude", tone: "accent", title: "Claude delegates part of the work", text: "For a complex billing dispute, the coordinator calls the `Agent` tool (formerly `Task`) and passes all the context the subagent needs in its prompt {{1.3}}." },
            { who: "Subagent", tone: "accent", inner: true, title: "The subagent runs its own loop", text: "It has a fresh context and its own scoped tools {{2.3}}. It returns structured findings with their sources {{5.6}}, or a structured error with what it tried {{5.3}}." },
            { who: "Claude", tone: "accent", title: "Claude produces a structured decision", text: "A JSON schema guarantees the shape of the output {{4.3}}. Code then checks the meaning, and sends specific errors back for a retry {{4.4}}." },
            { who: "Human", tone: "bad", title: "A person takes over if needed", text: "A refund above the limit is blocked by a hook and escalated with a structured handoff {{1.4}}. A policy gap or an explicit request for a human also escalates {{5.2}}." },
            { who: "Claude", tone: "accent", title: "`end_turn`: the answer is final", text: "The loop stops on `stop_reason`, never on the wording of the reply {{1.1}}. The session can later be resumed or forked {{1.7}}." },
          ],
        } },
        { type: "diagram", diagram: {
          kind: "flow", title: "Zoom: what surrounds every tool call",
          steps: [
            { label: "Claude asks", sub: "`tool_use` block", tone: "accent", edge: "intercept" },
            { label: "`PreToolUse` hook", sub: "allow, deny, ask", tone: "warn", edge: "allowed" },
            { label: "Tool executes", sub: "built-in or MCP", tone: "good", edge: "output" },
            { label: "`PostToolUse` hook", sub: "normalise, replace output", tone: "warn", edge: "cleaned" },
            { label: "Claude reads", sub: "`tool_result`", tone: "accent" },
          ],
          caption: "Hooks sit outside the model. It cannot skip them, which is what makes them deterministic.",
        } },
      ],
    },
    {
      id: "multi", nav: "Orchestrator and subagents", title: "How agents work together",
      intro: "**Orchestrator** and **coordinator** mean the same thing here: the agent that splits the work, delegates it and assembles the results. Each **subagent** is a complete agent with its own loop, tools and context.",
      blocks: [
        { type: "diagram", diagram: {
          kind: "hub", title: "Hub-and-spoke: everything goes through the coordinator",
          center: { label: "Coordinator (orchestrator)", sub: "decomposes, delegates, aggregates, handles errors" },
          edge: "the Agent tool, formerly Task",
          spokes: [
            { label: "Search subagent", sub: "own loop, own web tools" },
            { label: "Analysis subagent", sub: "own loop, document tools" },
            { label: "Synthesis subagent", sub: "receives the findings" },
            { label: "Report subagent", sub: "writes the cited report" },
          ],
          caption: "Subagents never talk to each other directly: the coordinator routes every result and error.",
        } },
        { type: "table",
          head: ["What travels", "Direction", "What it must contain", "Lesson"],
          rows: [
            ["The assignment", "Coordinator → subagent", "Goal, quality criteria and **all** needed context: a default subagent sees nothing else", "{{1.3}}"],
            ["The split of work", "Decided by the coordinator", "A fixed chain when steps are known, an adaptive plan when they are not", "{{1.6}}"],
            ["The findings", "Subagent → coordinator", "Structured facts, each with its source and date", "{{5.6}}"],
            ["The failures", "Subagent → coordinator", "Failure type, what was tried, partial results, alternatives", "{{5.3}}"],
            ["The next round", "Coordinator → subagents", "Targeted re-delegation of the gaps found in the synthesis", "{{1.2}}"],
          ] },
        { type: "callout", tag: "Subagent or fork?", text: "A **default subagent** starts with a fresh context, which keeps verbose work out of the main conversation. A **fork** inherits the whole conversation, which suits exploring two approaches from the same baseline {{1.3}}. Session forking does the same across sessions {{1.7}}." },
      ],
    },
    {
      id: "jobs", nav: "Which mechanism for which job", title: "Which mechanism for which job",
      intro: "Most exam questions come down to choosing the right mechanism. Two questions decide: **when is it active?** and **is the result guaranteed, or only likely?**",
      blocks: [
        { type: "table",
          head: ["Mechanism", "What it is for", "Active when", "Guarantee", "Lesson"],
          rows: [
            ["Prompt instruction", "Asking for a behaviour", "Every turn", "Likely", "{{4.1}}"],
            ["CLAUDE.md", "Standards that always apply", "Loaded at start", "Likely", "{{3.1}}"],
            ["Path rule (`.claude/rules/`)", "Conventions for some files, wherever they are", "When matching files are touched", "Likely", "{{3.3}}"],
            ["Skill or slash command", "A reusable task workflow", "On demand", "Likely", "{{3.2}}"],
            ["Few-shot examples", "Showing judgement and format", "Every turn", "Likely", "{{4.2}}"],
            ["**Hook**", "A rule that must always hold", "On every matching event", "**Deterministic**", "{{1.5}}"],
            ["**Prerequisite gate**", "Forcing an order of steps", "On every guarded call", "**Deterministic**", "{{1.4}}"],
            ["**Tool scoping**", "Limiting what an agent can call", "Always", "**Deterministic**", "{{2.3}}"],
            ["**JSON schema**", "The shape of the output", "Every structured response", "**Shape only**, not meaning", "{{4.3}}"],
            ["Plan mode", "Exploring safely before editing", "When selected", "**No edits** while planning", "{{3.4}}"],
            ["Subagent", "Isolating work and context", "When delegated", "Separate context", "{{1.3}}"],
            ["MCP tool", "Acting on an external system", "When the model calls it", "Executed by code", "{{2.4}}"],
            ["MCP resource", "Showing a catalog of content", "When the application reads it", "Read-only", "{{2.4}}"],
          ] },
        { type: "diagram", diagram: {
          kind: "decision", title: "The most-tested choice",
          question: "What happens if the rule is broken once?",
          branches: [
            { when: "Money, identity or compliance is at stake", then: "Enforce it in code: hook or gate", tone: "good" },
            { when: "A quality or style preference", then: "Instruct: prompt, CLAUDE.md, rules, examples" },
          ],
        } },
      ],
    },
    {
      id: "domains", nav: "Domains and scenarios", title: "The five domains and the six scenarios",
      intro: "The exam splits the system into five domains. Each one answers a different question about the same agent, and each depends on the others.",
      blocks: [
        { type: "table",
          head: ["Domain", "Weight", "The question it answers", "How it connects"],
          rows: [
            ["**1** Agentic Architecture & Orchestration", "27%", "How is the work organised and controlled?", "Runs the tools of D2, under the configuration of D3"],
            ["**2** Tool Design & MCP Integration", "18%", "What can the agent do?", "Gives D1 its capabilities; its errors feed D5"],
            ["**3** Claude Code Configuration & Workflows", "20%", "How does a team set it up and automate it?", "Packages D1, D2 and D4 for daily use and CI"],
            ["**4** Prompt Engineering & Structured Output", "20%", "How do we get precise, usable output?", "Sets the quality of every model call in D1"],
            ["**5** Context Management & Reliability", "15%", "How does it stay reliable over time?", "Protects long runs in D1 and decides when humans step in"],
          ] },
        { type: "table",
          head: ["Exam scenario", "Parts of the map it exercises"],
          rows: [
            ["**1** Customer Support Resolution Agent", "Loop, gates, hooks, MCP tools, escalation {{1.4}} {{2.2}} {{5.2}}"],
            ["**2** Code Generation with Claude Code", "CLAUDE.md, skills, plan mode, long sessions {{3.1}} {{3.4}} {{5.4}}"],
            ["**3** Multi-Agent Research System", "Coordinator, subagents, provenance {{1.2}} {{1.3}} {{5.6}}"],
            ["**4** Developer Productivity with Claude", "Built-in tools, MCP, exploration {{2.5}} {{2.4}} {{1.6}}"],
            ["**5** Claude Code for Continuous Integration", "`claude -p`, review criteria, multi-pass review {{3.6}} {{4.1}} {{4.6}}"],
            ["**6** Structured Data Extraction", "Schemas, retries, batches, human review {{4.3}} {{4.4}} {{4.5}} {{5.5}}"],
          ] },
      ],
    },
    {
      id: "themes", nav: "Every theme at a glance", title: "Every theme at a glance",
      intro: "A one-line definition of each theme, what it connects to, and where to learn it. Come back here whenever a term is unclear.",
      blocks: [
        { type: "themes", families: [
          { name: "The core: the loop and its session", items: [
            { term: "Agentic loop", ids: ["1.1"], what: "Call Claude, run the requested tools, return the results, repeat until `stop_reason` is `end_turn`.", fits: "The centre of everything: every other theme acts on this loop." },
            { term: "Sessions", ids: ["1.7"], what: "A saved conversation you can resume by name (`--resume`) or branch with `fork_session`.", fits: "Carries the loop's history across work sessions; stale results need a fresh summary." },
          ] },
          { name: "Organising the work: orchestration", items: [
            { term: "Coordinator / orchestrator", ids: ["1.2"], what: "The agent that splits a task, delegates it and assembles the results.", fits: "Hub of every subagent; owns routing, errors and coverage." },
            { term: "Subagents", ids: ["1.3"], what: "Separate agents spawned with the `Agent` tool (formerly `Task`), defined by an `AgentDefinition`.", fits: "Get context only through their prompt; report back to the coordinator." },
            { term: "Task decomposition", ids: ["1.6"], what: "Prompt chaining for predictable steps, dynamic decomposition for open-ended investigation.", fits: "Decides how many agents or passes the coordinator needs." },
            { term: "Workflow enforcement and handoff", ids: ["1.4"], what: "Programmatic prerequisites that force an order, and structured summaries for human takeover.", fits: "Uses hooks to guarantee what prompts can only request." },
            { term: "Hooks", ids: ["1.5"], what: "Code the harness runs on events: `PreToolUse` can block a call, `PostToolUse` can rewrite a result.", fits: "Wrap every tool call; the deterministic layer of the system." },
          ] },
          { name: "Giving it abilities: tools and MCP", items: [
            { term: "Tool interfaces", ids: ["2.1"], what: "The name and description Claude uses to choose between tools.", fits: "Poor descriptions cause wrong calls before any other part can help." },
            { term: "Structured errors", ids: ["2.2"], what: "The MCP `isError` flag with a category and a retryable indicator.", fits: "Lets the loop retry, explain or escalate; feeds error propagation." },
            { term: "Tool distribution and `tool_choice`", ids: ["2.3"], what: "Give each agent only the tools of its role; `auto`, `any` or a forced tool control whether one is called.", fits: "Keeps subagents focused and selection reliable." },
            { term: "MCP servers", ids: ["2.4"], what: "A standard way to expose tools and resources, configured in `.mcp.json` or `~/.claude.json`.", fits: "Connects the agent to backends; their tools join the built-in ones." },
            { term: "Built-in tools", ids: ["2.5"], what: "Read, Write, Edit, Bash, Grep (contents) and Glob (file paths).", fits: "Come with the harness, for both Claude Code and the Agent SDK." },
          ] },
          { name: "Setting it up for a team: Claude Code", items: [
            { term: "CLAUDE.md hierarchy", ids: ["3.1"], what: "Instructions at user, project and directory level, with `@import` and `/memory`.", fits: "Always in context, including for CI runs and SDK agents." },
            { term: "Skills and slash commands", ids: ["3.2"], what: "Reusable workflows with frontmatter such as `context: fork` and `allowed-tools`.", fits: "Load on demand; `context: fork` runs them in a subagent." },
            { term: "Path-specific rules", ids: ["3.3"], what: "`.claude/rules/` files with `paths:` globs that load only for matching files.", fits: "The conditional counterpart of CLAUDE.md." },
            { term: "Plan mode and Explore", ids: ["3.4"], what: "Read-only investigation before edits; the Explore subagent keeps discovery out of the main context.", fits: "Comes before direct execution on large or architectural changes." },
            { term: "Iterative refinement", ids: ["3.5"], what: "Input/output examples, tests first, and the interview pattern to converge quickly.", fits: "How a developer steers the loop turn after turn." },
            { term: "CI/CD integration", ids: ["3.6"], what: "`claude -p` with `--output-format json` and `--json-schema` in a pipeline.", fits: "Runs the harness unattended, using the project's CLAUDE.md." },
          ] },
          { name: "Getting precise output: prompts and schemas", items: [
            { term: "Explicit criteria", ids: ["4.1"], what: "Categories of what to report and skip, instead of \"be conservative\".", fits: "First lever for precision; protects developer trust in reviews." },
            { term: "Few-shot prompting", ids: ["4.2"], what: "Two to four targeted examples that show the reasoning on ambiguous cases.", fits: "Fixes format and judgement where instructions alone are not enough." },
            { term: "Structured output", ids: ["4.3"], what: "Tool use or structured outputs with a JSON schema; nullable fields prevent invented values.", fits: "Makes model output safe for downstream code." },
            { term: "Validation and retry", ids: ["4.4"], what: "Check meaning in code, then retry with the specific error. Retries cannot recover absent information.", fits: "Completes the schema, which only guarantees shape." },
            { term: "Batch processing", ids: ["4.5"], what: "The Message Batches API: 50% cheaper, up to 24 hours, results matched by `custom_id`.", fits: "For work nobody waits for; never for a blocking check." },
            { term: "Multi-pass review", ids: ["4.6"], what: "Per-file passes, a cross-file pass, and an independent instance to review generated code.", fits: "Applies decomposition to review quality." },
          ] },
          { name: "Staying reliable: context, errors and humans", items: [
            { term: "Preserving context", ids: ["5.1"], what: "A persistent case-facts block, trimmed tool output and key findings placed first.", fits: "Stops long loops from forgetting amounts, dates and promises." },
            { term: "Escalation", ids: ["5.2"], what: "Hand over on an explicit request, a policy gap or no progress; not on sentiment.", fits: "The exit from the loop towards a person." },
            { term: "Error propagation", ids: ["5.3"], what: "Retry locally, then report failure type, attempts and partial results.", fits: "Connects tool errors to the coordinator's recovery decisions." },
            { term: "Large codebase exploration", ids: ["5.4"], what: "Scratchpad files, subagents, `/compact` and state manifests for crash recovery.", fits: "Keeps long Claude Code sessions accurate." },
            { term: "Human review and calibration", ids: ["5.5"], what: "Field-level confidence calibrated on labelled data, plus stratified sampling.", fits: "Decides which outputs people must check." },
            { term: "Provenance", ids: ["5.6"], what: "Claim-source mappings, dates and annotated conflicts that survive synthesis.", fits: "Keeps multi-agent reports verifiable." },
          ] },
        ] },
        { type: "callout", tag: "Reading order", text: "Lessons follow the exam domains. Start with the loop {{1.1}}, then hooks {{1.5}} and tools {{2.1}}: nearly every other lesson builds on those three." },
      ],
    },
  ],
};

/* ============================================================================
   CCAR-F lessons — Domain 1: Agentic Architecture & Orchestration
   One short lesson per task statement. Written from tools/facts.md and the
   public Exam Guide v1.0. Schema: see tools/check-lessons.mjs.
   ============================================================================ */
window.CCARF_LESSONS = window.CCARF_LESSONS || [];
window.CCARF_LESSONS.push(
  {
    id: "1.1",
    tldr: "An agent is a loop: call Claude, run every tool it asks for, append the results, call again — and stop only when `stop_reason` is `end_turn`.",
    diagram: {
      kind: "flow",
      title: "The agentic loop",
      steps: [
        { label: "Call the Messages API", sub: "full history + tools", edge: "response" },
        { label: "Read `stop_reason`", sub: "the only stop signal", tone: "accent", edge: "`tool_use`" },
        { label: "Run each `tool_use`", sub: "your code executes", edge: "results" },
        { label: "Append to history", sub: "assistant turn + all `tool_result`s in one user turn" },
      ],
      loop: "Repeat until `stop_reason` is `end_turn` — then return the final answer",
    },
    points: [
      "The API is **stateless**: every call resends the whole conversation, including previous tool calls and results.",
      "`tool_use` → keep looping. `end_turn` → done. Other values (`max_tokens`, `pause_turn`, `refusal`) need their own handling, not a blind retry.",
      "Return **every** `tool_result` for one assistant turn in a **single** user message, each with its matching `tool_use_id`.",
      "A failed tool still returns a `tool_result`, with `is_error: true` — never drop it, or the next call is rejected.",
      "**Model-driven**: Claude chooses the next tool from what it just learned. A pre-scripted tool sequence is a workflow, not an agent.",
    ],
    code: "while True:\n    resp = client.messages.create(model=M, tools=tools, messages=history)\n    history.append({\"role\": \"assistant\", \"content\": resp.content})\n    if resp.stop_reason != \"tool_use\":\n        break                      # end_turn: final answer\n    results = [run(block) for block in resp.content if block.type == \"tool_use\"]\n    history.append({\"role\": \"user\", \"content\": results})",
    traps: [
      { wrong: "Stop when the reply text contains \"DONE\" or when any text appears.", right: "Text can accompany a tool call. Only `stop_reason` says the turn is over." },
      { wrong: "Use a max-iterations counter as the way the loop ends.", right: "A cap is a safety net against runaway loops, not the primary stop condition." },
      { wrong: "Send each tool result in its own user message.", right: "One user message with all the results of that turn; splitting them degrades parallel tool use." },
    ],
    exam: "If an option decides termination from anything other than `stop_reason` (text content, a keyword, an iteration count), it is the anti-pattern.",
    sources: [
      { label: "Implement tool use", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use" },
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
    ],
  },
  {
    id: "1.2",
    tldr: "In hub-and-spoke, the coordinator owns everything between subagents: it splits the task, picks who runs, collects results, handles errors and loops until coverage is enough. Subagents talk only to the hub.",
    diagram: {
      kind: "hub",
      title: "Coordinator-subagent (hub-and-spoke)",
      center: { label: "Coordinator", sub: "decompose · delegate · aggregate · handle errors", tone: "accent" },
      spokes: [
        { label: "Web search subagent", sub: "its own subtopics / source types" },
        { label: "Document analysis subagent", sub: "distinct scope, no overlap" },
        { label: "Synthesis subagent", sub: "gets the findings from the hub" },
        { label: "Subagent ↔ subagent", sub: "never directly", tone: "bad" },
      ],
      edge: "every result and error goes through the hub",
      caption: "One routing point gives observability, consistent error handling and one coherent answer.",
    },
    points: [
      "**Isolated context**: subagents do not see the coordinator's history. Whatever they need must go into the delegation (see 1.3).",
      "**Select dynamically**: analyse each query and invoke only the subagents it needs. A one-line factual question should not run the full pipeline.",
      "**Partition scope**: give each subagent distinct subtopics or source types, so they do not fetch the same sources and duplicate findings.",
      "Avoid **overly narrow decomposition**: list the topic's major dimensions first and check the subtasks cover each one before delegating.",
      "**Iterative refinement**: the coordinator checks the synthesis for gaps, re-delegates targeted queries, then re-runs synthesis, within a set round limit.",
      "**Aggregation is the hub's job**: it reconciles conflicting results (flags them, re-checks) and sends one reply, rather than each subagent answering the user.",
    ],
    traps: [
      { wrong: "Let the search subagent hand results straight to the report subagent to save latency.", right: "Failures then become silent gaps and nobody can trace inputs. Route everything through the coordinator." },
      { wrong: "Every subagent succeeded, so a report with missing areas must be a synthesis problem.", right: "Correct work on incomplete assignments means the coordinator's decomposition was too narrow." },
      { wrong: "When two subagents disagree, keep the result that arrived last.", right: "The coordinator merges, flags the conflict and re-delegates a targeted check." },
    ],
    exam: "When a symptom spans subagents (duplicates, gaps, conflicts, silent failures, two replies), the fix is in the coordinator's decomposition, routing or aggregation, not in one subagent.",
    sources: [
      { label: "How we built our multi-agent research system", url: "https://www.anthropic.com/engineering/multi-agent-research-system" },
      { label: "Subagents in the SDK", url: "https://code.claude.com/docs/en/agent-sdk/subagents" },
    ],
  },
  {
    id: "1.3",
    tldr: "A subagent knows only what you put in its prompt. Spawn it with the `Agent` tool (formerly `Task`), pass complete structured findings, and state goals rather than procedures.",
    diagram: {
      kind: "compare",
      title: "What a spawned subagent works with",
      columns: [
        { title: "Default subagent receives", tone: "good", items: ["Its own `AgentDefinition` prompt", "The prompt string the parent passes", "Project CLAUDE.md, when project settings load"] },
        { title: "It does not receive", tone: "bad", items: ["The parent's conversation history", "The parent's tool results", "Other subagents' outputs, unless passed in", "Memory from earlier invocations"] },
        { title: "Fork subagent", tone: "accent", items: ["`subagent_type: \"fork\"`", "Inherits the full parent conversation", "For divergent drafts from a shared baseline"] },
      ],
    },
    points: [
      "The coordinator spawns subagents with the **`Agent` tool (formerly `Task`, still accepted as an alias)**. If it is not in `allowedTools`, the coordinator never delegates.",
      "**Pass context explicitly**: include the complete prior findings (search results, analysis outputs, source excerpts) in the subagent's prompt.",
      "Use **structured records** that keep each piece of content next to its metadata (URL, document name, page), so attribution survives the handoff.",
      "**Parallel** = several `Agent` calls in **one** coordinator response. One call per turn runs them one after another.",
      "Give **goals and quality criteria** (coverage, source types, recency), not a 12-step procedure, so the subagent can adapt when a step fails.",
      "`AgentDefinition`: `description` is what the parent reads to decide when to delegate; `prompt` is its system prompt; `tools` restricts it to least privilege.",
    ],
    code: "options = ClaudeAgentOptions(\n    allowed_tools=[\"Agent\", \"Read\", \"Grep\"],   # Agent (formerly Task) lets it spawn\n    agents={\n        \"synthesis\": AgentDefinition(\n            description=\"Writes the cited report from research findings.\",\n            prompt=\"Synthesize the findings you are given. Cite every claim.\",\n            tools=[\"Read\"],                      # no Bash, no Write\n        ),\n    },\n)",
    traps: [
      { wrong: "\"Synthesize the research so far\" is enough: the subagent can see what the others found.", right: "It starts with fresh context. Generic, uncited output means the findings were never passed." },
      { wrong: "Concatenate findings as prose and append all source URLs at the end.", right: "Citations drift to the wrong claims. Keep each finding with its own source fields." },
      { wrong: "Subagents can never inherit the parent's context.", right: "True for default subagents; fork subagents inherit the parent conversation." },
    ],
    exam: "Never delegates → `Agent` missing from `allowedTools`. Generic or unsourced output → context missing from the prompt. Sequential when independent → put the calls in one response.",
    sources: [
      { label: "Subagents in the SDK", url: "https://code.claude.com/docs/en/agent-sdk/subagents" },
      { label: "Claude Code subagents", url: "https://code.claude.com/docs/en/sub-agents" },
    ],
  },
  {
    id: "1.4",
    tldr: "When an order of steps must always hold (verify, then refund), enforce it in code with a prerequisite gate. A prompt instruction only makes it likely.",
    diagram: {
      kind: "flow",
      title: "A programmatic prerequisite gate",
      steps: [
        { label: "`get_customer` returns a verified ID", sub: "your code records it in session state", edge: "later" },
        { label: "Model calls `process_refund`", sub: "the prompt said verify first — usually obeyed", edge: "intercepted" },
        { label: "Gate in code", sub: "verified ID present for this customer?", tone: "accent", edge: "yes" },
        { label: "Refund runs", tone: "good" },
      ],
      caption: "No → block with a reason naming the missing step, so the model verifies and retries instead of giving up.",
    },
    points: [
      "**Prompt guidance is probabilistic**: 99.5% compliance over 40,000 conversations a month still means about 200 violations. Identity before money, or validation before submission, needs **programmatic enforcement**.",
      "The gate checks what actually **returned** (a verified customer ID, a validated record ID in this run), not what the model says it did.",
      "The block reason must **name the missing prerequisite**, so the model can call `get_customer` and retry rather than apologise and end the conversation.",
      "**Multi-concern requests**: split the message into distinct items, investigate them in parallel with the shared customer context, then send one unified resolution.",
      "In CI, the pipeline itself runs the test suite as a step and posts approval only on a success exit code; the model does not decide whether to test.",
    ],
    traps: [
      { wrong: "Strengthen the prompt: capitals, repeat the rule, add examples.", right: "That raises the rate but never guarantees it. A must-hold ordering belongs in a code gate." },
      { wrong: "Escalate with \"customer needs help with a refund, see conversation\".", right: "The human cannot see the transcript. Send a **structured handoff**: customer ID, issue, root cause, actions taken, amount, recommended next step." },
    ],
    exam: "Words like \"must\", \"never\", \"compliance requires\", or a small failure rate at scale point to a code-level gate, not a prompt tweak. For escalation, pick the self-contained structured summary.",
    sources: [
      { label: "Agent SDK hooks", url: "https://code.claude.com/docs/en/agent-sdk/hooks" },
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
    ],
  },
  {
    id: "1.5",
    tldr: "Hooks run in the harness around every tool call. PreToolUse can block a call before it runs, and PostToolUse can rewrite the result before the model sees it. Both happen every time, unlike a prompt rule.",
    diagram: {
      kind: "flow",
      title: "Where hooks intercept a tool call",
      steps: [
        { label: "Model requests a tool call", edge: "before" },
        { label: "PreToolUse hook", sub: "allow · deny + reason · ask (exit code 2 also blocks)", tone: "accent", edge: "allowed" },
        { label: "Tool runs", sub: "MCP or built-in", edge: "raw result" },
        { label: "PostToolUse hook", sub: "`updatedToolOutput` replaces · `additionalContext` appends", tone: "accent", edge: "clean result" },
        { label: "Model reasons on it", tone: "good" },
      ],
    },
    points: [
      "**PreToolUse** enforces policy on outgoing calls: refunds above $500, `git push --force`, edits under `migrations/`. Deny with `permissionDecision: \"deny\"` and a reason, which is fed back to the model.",
      "**Deny and redirect**: the reason points to the alternative path, such as calling `escalate_to_human`.",
      "Check the real quantity: the order's **cumulative** refunds, not just this call's amount, or the model can split $900 into two $450 calls.",
      "**PostToolUse** normalises data before the model reasons: Unix vs ISO 8601 times, numeric status codes to names, stripping bulky metadata, masking account numbers.",
      "`updatedToolOutput` works for **any** tool, built-ins included. The older `updatedMCPToolOutput` covered MCP tools only.",
    ],
    code: "async def cap_refunds(input_data, tool_use_id, context):\n    if input_data[\"tool_input\"][\"amount\"] > 500:\n        return {\"hookSpecificOutput\": {\n            \"hookEventName\": \"PreToolUse\",\n            \"permissionDecision\": \"deny\",\n            \"permissionDecisionReason\": \"Over $500: call escalate_to_human.\",\n        }}\n    return {}\n\noptions = ClaudeAgentOptions(hooks={\n    \"PreToolUse\": [HookMatcher(matcher=\"process_refund\", hooks=[cap_refunds])],\n})",
    traps: [
      { wrong: "Write the $500 limit in the system prompt or CLAUDE.md, in capitals.", right: "Prompt rules are probabilistic, and the agent already broke one. A hook is deterministic." },
      { wrong: "Explain each tool's date format in the prompt and let the model convert.", right: "Normalise once in PostToolUse so the model only ever sees one format." },
    ],
    exam: "A rule that must hold before an action → PreToolUse deny with a reason. Inconsistent, bloated or sensitive tool output → PostToolUse rewrite. Options that rely on prompt wording for a guarantee are distractors.",
    sources: [
      { label: "Agent SDK hooks", url: "https://code.claude.com/docs/en/agent-sdk/hooks" },
      { label: "Hooks reference", url: "https://code.claude.com/docs/en/hooks" },
    ],
  },
  {
    id: "1.6",
    tldr: "If you can write the steps down before seeing the data, use a fixed prompt chain. If the next step depends on what you find, use dynamic decomposition that plans from intermediate findings.",
    diagram: {
      kind: "compare",
      title: "Two ways to decompose a task",
      columns: [
        { title: "Prompt chaining (fixed)", items: ["Steps known in advance, same each run", "Style → security → coverage, one focused step each", "Per-file passes, then one cross-file integration pass", "Per endpoint: convert → test → commit"] },
        { title: "Dynamic decomposition (adaptive)", items: ["Next subtask comes from the last finding", "\"Why did market share fall?\" — follow the leads", "Map the structure → high-impact areas → prioritised plan", "Plan changes as dependencies appear"] },
      ],
      caption: "Test: can you write the steps down before the request arrives?",
    },
    points: [
      "**Prompt chaining**: a fixed sequence where each step works on the previous step's output. It trades latency for focus and is easy to audit, so it suits predictable multi-aspect reviews and repetitive migrations.",
      "**Attention dilution**: one prompt covering everything on a big input goes shallow. Split it into focused local passes (per file, per document type).",
      "Local passes miss interactions, so add a separate **integration pass** fed with each part's interfaces or results (a renamed field breaking another file).",
      "**Dynamic decomposition** generates subtasks from what each step reveals: a regulator notice about a recall becomes a new line of inquiry.",
      "For open-ended codebase work, **map first** (grep entry points, follow imports) rather than reading every file up front, then prioritise and adapt.",
    ],
    traps: [
      { wrong: "Use a bigger context window and review all 30 files in one prompt.", right: "A larger window does not fix dilution. Use focused passes plus an integration pass." },
      { wrong: "Run an investigation as a fixed search → analyse → summarise pipeline.", right: "Causes found mid-investigation get missed. Let findings generate new subtasks." },
    ],
    exam: "Same steps every time (CI review, bulk conversion) → prompt chaining. The answer depends on discoveries (root cause, legacy exploration) → dynamic decomposition. One prompt missing things → focused passes plus an integration pass.",
    sources: [
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
      { label: "Effective context engineering", url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" },
    ],
  },
  {
    id: "1.7",
    tldr: "Resuming restores the old transcript, stale tool results included. Resume when that history is still mostly true, fork to branch from it, and start fresh with a summary when most of it is stale.",
    diagram: {
      kind: "decision",
      title: "Resume, fork or start fresh?",
      question: "How much of what the session read is still true today?",
      branches: [
        { when: "All of it: nothing changed", then: "Resume: `claude --resume <name>` · SDK `resume: <id>`", tone: "good" },
        { when: "A few known files changed", then: "Resume, list the changed files, re-analyse only those", tone: "good" },
        { when: "Most of it (big merge, state moved on)", then: "New session seeded with a structured summary, then re-read", tone: "warn" },
        { when: "Two approaches from one baseline", then: "Fork: `--fork-session` · `fork_session=True` → new ID", tone: "accent" },
      ],
    },
    points: [
      "Name a session with `claude -n <name>` or `/rename`, and return with `claude --resume <name>`. `--continue` takes only the most recent session in the directory, which is wrong after other work or with concurrent CI jobs.",
      "Agent SDK: store the session ID and pass it as `resume`. Add `forkSession: true` (TS) or `fork_session=True` (Py) to branch instead.",
      "A **fork** gets a new session ID and leaves the original untouched. Branches are independent, so you can compare two refactoring or testing strategies.",
      "**Stale results look current**: a resumed agent cites functions and line numbers from its old reads. Tell it which files changed and how, for targeted re-analysis instead of full re-exploration.",
      "A **structured summary** (conclusions that still hold, open questions) in a fresh session is more reliable than resuming over mostly stale results. Then re-query the current state.",
    ],
    traps: [
      { wrong: "On resume, the agent will notice the files changed.", right: "It trusts its transcript. You must tell it what changed." },
      { wrong: "Fork the session to pick up a teammate's new code.", right: "A fork copies the same stale history. Forks are for divergent approaches, not for refreshing." },
    ],
    exam: "Pick by staleness: mostly valid → resume (plus a list of changed files); mostly stale → fresh session with a summary; two competing approaches from one baseline → fork.",
    sources: [
      { label: "Claude Code sessions", url: "https://code.claude.com/docs/en/sessions" },
      { label: "Agent SDK sessions", url: "https://code.claude.com/docs/en/agent-sdk/sessions" },
      { label: "CLI reference", url: "https://code.claude.com/docs/en/cli-reference" },
    ],
  },
);

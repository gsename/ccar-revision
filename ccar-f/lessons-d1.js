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
);

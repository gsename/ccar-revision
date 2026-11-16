/* ============================================================================
   CCAR-P lessons — Domain 7: Developer Productivity & Operational Enablement
   One short lesson per objective. Written from tools/facts.md and the public
   Exam Guide v1.0. Schema: see tools/check-lessons.mjs.
   ============================================================================ */
window.CCARP_LESSONS = window.CCARP_LESSONS || [];
window.CCARP_LESSONS.push(
  {
    id: "7.1",
    tldr: "Put each Claude Code setting at the scope that matches who it binds: managed policy for rules nobody may loosen, committed project files for the team, local or user files for one person.",
    diagram: {
      kind: "layers",
      title: "settings.json precedence (high → low)",
      layers: [
        { label: "Managed policy settings", sub: "Deployed by IT; cannot be overridden by any level", tag: "wins", tone: "accent" },
        { label: "CLI arguments", sub: "This invocation only" },
        { label: ".claude/settings.local.json", sub: "Personal, this project, not committed" },
        { label: ".claude/settings.json", sub: "Project, committed: the team's shared config", tag: "shared", tone: "good" },
        { label: "~/.claude/settings.json", sub: "User, all projects" },
      ],
      axis: "Higher overrides lower; a deny rule wins over an allow",
      caption: "A local allow cannot beat a managed deny: managed policy is the only place for org-wide, non-negotiable rules.",
    },
    points: [
      "**Permissions** use `allow` / `ask` / `deny` rules such as `Bash(npm run test:*)` or `Read(./.env)`. Deny wins, so an org-wide deny in managed settings blocks it for every developer.",
      "**Instructions** follow the same split: team standards in the committed `./CLAUDE.md`, personal preferences in `CLAUDE.local.md` or `~/.claude/CLAUDE.md`.",
      "**MCP for a team**: project scope (`.mcp.json` at the repo root, committed) with `${VAR}` expansion, so each developer supplies their own credential and no secret reaches git.",
      "**Shared workflows** are project skills in `.claude/skills/` (custom commands are now merged into skills; `.claude/commands/` still works). `disable-model-invocation: true` makes a skill run only when typed.",
      "**\"Every time X, do Y\"** is a hook, not an instruction: hooks run in the harness, deterministically. A `PostToolUse` hook on `Edit|Write` in committed project settings formats every edit for everyone.",
    ],
    code: "// .claude/settings.json — committed, applies to the whole team\n{\n  \"permissions\": {\n    \"allow\": [\"Bash(npm run test:*)\"],\n    \"deny\": [\"Read(./.env)\", \"Bash(curl:*)\"]\n  },\n  \"hooks\": {\n    \"PostToolUse\": [{\n      \"matcher\": \"Edit|Write\",\n      \"hooks\": [{ \"type\": \"command\", \"command\": \"npm run format\" }]\n    }]\n  }\n}",
    traps: [
      { wrong: "Put the org's security deny rules in the project `.claude/settings.json`.", right: "Any repo can edit or omit that file. Non-negotiable rules belong in managed policy settings." },
      { wrong: "Add the MCP server at local scope to keep the credential private.", right: "Then it is neither shared nor versioned. Use project scope with `${VAR}` for the secret." },
      { wrong: "A good description is enough to keep a release skill from running by itself.", right: "The description is what enables auto-invocation. Set `disable-model-invocation: true`." },
    ],
    exam: "Ask who the setting must bind and whether it may be loosened. Everyone, never loosened → managed. Team, versioned → project file. One person → local or user. Must happen every time → hook.",
    sources: [
      { label: "Claude Code settings", url: "https://code.claude.com/docs/en/settings" },
      { label: "Claude Code MCP", url: "https://code.claude.com/docs/en/mcp" },
      { label: "Claude Code hooks", url: "https://code.claude.com/docs/en/hooks" },
    ],
  },
  {
    id: "7.2",
    tldr: "Use the Claude Code feature built for each workflow need: plan mode for reviewed changes, the Explore subagent for noisy discovery, print mode and the GitHub Action for automation, and resume with care.",
    diagram: {
      kind: "hub",
      title: "Claude Code features mapped to workflow needs",
      center: { label: "Developer workflow", sub: "Pick the feature built for the need" },
      spokes: [
        { label: "Plan mode", sub: "Read-only exploration + a plan approved before any edit", tone: "good" },
        { label: "Explore subagent", sub: "Verbose search in its own context; returns a summary" },
        { label: "`claude -p` + `--json-schema`", sub: "Non-interactive CI step; validated JSON out", tone: "accent" },
        { label: "GitHub Action", sub: "`/install-github-app`: app + secret + workflow, PR reviews" },
        { label: "Named sessions", sub: "`--resume` restores the transcript; stale results possible", tone: "warn" },
      ],
    },
    points: [
      "**Plan mode** (Shift+Tab cycle, or `--permission-mode plan`) limits Claude to read-only exploration and a plan you approve. It fits any gate that requires a reviewed plan **before** changes.",
      "**Explore subagent**: delegate large read-only discovery so the raw search output stays out of the main session, which gets only the summary and keeps its focus.",
      "**Print mode** `-p` runs, prints and exits. Add `--output-format json` for scripting, or `--json-schema` for output validated against a schema. `--headless` and `CLAUDE_HEADLESS` are not real options.",
      "**PR automation**: `anthropics/claude-code-action` runs on GitHub's runners on each pull request, with no servers to maintain. `/install-github-app` sets up the app, secret and workflow.",
      "**Resuming** (`claude --resume <name>`) brings back the transcript, including tool results that may now be stale. Tell Claude which files changed so it re-reads them. `--fork-session` only branches the same history under a new ID.",
    ],
    traps: [
      { wrong: "Run in `acceptEdits` and review the diff afterwards to meet a plan-review rule.", right: "The rule requires approval before changes. Use plan mode, then execute." },
      { wrong: "Run `/compact` often to cope with floods of search output.", right: "The output still fills the window first and details are lost. Isolate it in the Explore subagent." },
      { wrong: "Ask for \"pure JSON\" in the prompt for a CI parser.", right: "That often works but guarantees nothing. Use `-p` with `--json-schema`." },
    ],
    exam: "Match the constraint to the built-in feature: review before edits → plan mode, context flooding → Explore, CI or parser → `-p` (+ `--json-schema`), PR reviews without servers → GitHub Action. Distrust invented flags.",
    sources: [
      { label: "Common workflows", url: "https://code.claude.com/docs/en/common-workflows" },
      { label: "Headless / print mode", url: "https://code.claude.com/docs/en/headless" },
      { label: "Claude Code GitHub Actions", url: "https://code.claude.com/docs/en/github-actions" },
    ],
  },
  {
    id: "7.3",
    tldr: "Diagnose before you change anything. Use the built-in command that observes the symptom (`/mcp`, `/memory`, `/context`, `/doctor`, `--debug`), and handle API errors by whether a retry can succeed.",
    diagram: {
      kind: "decision",
      title: "Which first diagnostic?",
      question: "What is the symptom?",
      branches: [
        { when: "MCP tools missing", then: "`/mcp`: server status, incl. pending project-server approval", tone: "good" },
        { when: "An instruction is ignored", then: "`/memory`: which CLAUDE.md files are actually loaded", tone: "good" },
        { when: "Sessions feel crowded, quality slips early", then: "`/context`: what fills the window (tool schemas, memory)", tone: "good" },
        { when: "Install misbehaves, tools blocked", then: "`/doctor` for health; relaunch with `--debug` for hook/MCP logs", tone: "good" },
      ],
      caption: "All of these observe without changing the team's committed configuration.",
    },
    points: [
      "**Project-scoped MCP servers** ask for interactive approval. A developer who skipped or declined it will lack the tools teammates have, and `/mcp` shows that.",
      "A **subdirectory CLAUDE.md** loads only when Claude works in that directory. `/memory` confirms what is loaded, which no amount of capitalised emphasis can fix.",
      "A dozen MCP servers and a long CLAUDE.md eat context before any work starts. `/context` shows the split. Measure first, then cut servers or trim memory files.",
      "**API errors**: 429, 529, 5xx and 408/409 are transient. Retry with exponential backoff (SDKs already retry). 400, 401, 403, 404 and 413 fail the same way every time: fail fast and fix the request.",
      "A refusal is HTTP 200 with `stop_reason: \"refusal\"`, not an error code. Log `stop_reason`, request ID and prompt version so incidents can be traced.",
    ],
    table: {
      head: ["Signal", "Meaning", "Action"],
      rows: [
        ["429", "Rate limited", "Back off and retry; smooth peaks"],
        ["529 / 5xx", "Overloaded / server error", "Back off and retry"],
        ["400", "Malformed request", "No retry; fix the client"],
        ["401 / 403", "Auth / permission", "No retry; fix credentials or access"],
      ],
    },
    traps: [
      { wrong: "Delete `~/.claude.json` or reinstall to get a clean state.", right: "That destroys local and user settings and the evidence. Observe first with `/doctor`, `/mcp`, `--debug`." },
      { wrong: "`/doctor` explains why the context window is crowded.", right: "`/doctor` checks installation health. `/context` shows what occupies the window." },
      { wrong: "Retry every failed API call for resilience.", right: "Retrying a 400 adds load and never succeeds. Retry only transient codes." },
    ],
    exam: "Pick the read-only diagnostic that directly observes the reported symptom before any reinstall, reset or rewrite. For API errors, retry only what can succeed on a second attempt.",
    sources: [
      { label: "Claude Code settings", url: "https://code.claude.com/docs/en/settings" },
      { label: "Claude Code MCP", url: "https://code.claude.com/docs/en/mcp" },
      { label: "Claude Code memory", url: "https://code.claude.com/docs/en/memory" },
    ],
  },
);

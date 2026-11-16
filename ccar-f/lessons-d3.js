/* ============================================================================
   CCAR-F lessons — Domain 3: Claude Code Configuration & Workflows
   One short lesson per task statement. Written from tools/facts.md and the
   public Exam Guide v1.0. Schema: see tools/check-lessons.mjs.
   ============================================================================ */
window.CCARF_LESSONS = window.CCARF_LESSONS || [];
window.CCARF_LESSONS.push(
  {
    id: "3.1",
    tldr: "Where an instruction lives decides who gets it. Team conventions go in the committed project `CLAUDE.md` (or `.claude/rules/`); `~/.claude/CLAUDE.md` is yours alone and never reaches a teammate.",
    diagram: {
      kind: "layers",
      title: "CLAUDE.md levels — who receives what",
      layers: [
        { label: "Managed policy", sub: "OS-level path set by IT, applies org-wide", tag: "org" },
        { label: "User — `~/.claude/CLAUDE.md`", sub: "all your projects, not in version control", tag: "personal", tone: "warn" },
        { label: "Project — `./CLAUDE.md` or `./.claude/CLAUDE.md`", sub: "committed: every clone and CI run gets it", tag: "shared", tone: "good" },
        { label: "Project rules — `.claude/rules/*.md`", sub: "topic files, loaded like project memory (or by path)", tag: "shared", tone: "good" },
        { label: "Local — `./CLAUDE.local.md`", sub: "you, this project only", tag: "personal", tone: "warn" },
        { label: "Subdirectory `CLAUDE.md`", sub: "loaded on demand when Claude works in that folder", tag: "on demand" },
      ],
      caption: "Ask \"who must see this rule?\" — then pick the level whose audience matches.",
    },
    points: [
      "**User level** is private: a newcomer missing the team's conventions is the classic symptom of rules stored in `~/.claude/CLAUDE.md`. Fix: move them to the project file and commit it.",
      "`CLAUDE.local.md` is personal too, so a CI runner never sees it. Anything a pipeline needs belongs in a committed file.",
      "**`@path` imports** keep files modular: each package's `CLAUDE.md` imports only the standards its maintainers know apply. Relative paths resolve from the importing file; nesting stops at **4 hops**.",
      "**`.claude/rules/`** replaces a monolithic file with focused topics (`testing.md`, `api-conventions.md`, `deployment.md`). Without `paths` frontmatter they load at launch, like `CLAUDE.md`.",
      "Subdirectory `CLAUDE.md` files load only when Claude reads or edits files there, not at launch from the repo root.",
      "**`/memory`** lists the memory files actually loaded in this session and opens them for editing: the first check when behaviour differs between people or sessions.",
    ],
    code: "# packages/billing/CLAUDE.md\n@../../docs/standards/api.md\n@../../docs/standards/payments.md\n\nBilling amounts are integers in cents.",
    traps: [
      { wrong: "Ask each developer to copy the senior dev's `~/.claude/CLAUDE.md`.", right: "Copies drift and miss future hires. Commit the conventions at project level once." },
      { wrong: "Imports nest without limit (or up to 5 hops).", right: "Current docs: 4 hops. Older docs said 5 — a stale value." },
      { wrong: "Use the `#` quick-memory shortcut as the way to manage team memory.", right: "Edit the right file (via `/memory` or directly) and commit what the team needs." },
    ],
    exam: "When a symptom is \"works for me, not for them\" or \"works locally, not in CI\", the answer moves the instruction to a committed project-level file. `/memory` is the diagnostic.",
    sources: [
      { label: "Manage Claude's memory", url: "https://code.claude.com/docs/en/memory" },
    ],
  },
  {
    id: "3.2",
    tldr: "Skills are on-demand workflows invoked as `/name`; `CLAUDE.md` is always loaded. Project skills in `.claude/skills/` are shared through git; frontmatter controls isolation (`context: fork`), tools and arguments.",
    diagram: {
      kind: "compare",
      title: "Skill or CLAUDE.md?",
      columns: [
        { title: "Skill (`SKILL.md`)", items: [
          "Loaded on demand: only name + description sit in context",
          "A task-specific workflow: `/review`, `/migrate-table`",
          "Can fork into a subagent, restrict tools, hint arguments",
        ] },
        { title: "CLAUDE.md", items: [
          "Loaded in every session",
          "Universal standards that apply to all work",
          "Keep it short: every line costs context, always",
        ] },
      ],
      caption: "Universal and always relevant → CLAUDE.md. A procedure you run sometimes → a skill.",
    },
    points: [
      "**Scope**: `.claude/skills/` (and `.claude/commands/`) are project-level, version-controlled, team-wide. `~/.claude/skills/` and `~/.claude/commands/` are personal. Custom commands are now merged into skills; `.claude/commands/*.md` still works.",
      "**`context: fork`** runs the skill in a fresh subagent without the conversation history; only its result returns. Use it for verbose output (codebase analysis) or exploratory brainstorming. `agent: Explore` picks a read-only agent type.",
      "**`allowed-tools`** limits what the skill may use (e.g. `Read`, `Grep`, `Write` but no `Bash`), so it cannot take destructive actions.",
      "**`argument-hint`** shows the expected parameter (`[table-name]`) when the skill is invoked, instead of Claude guessing.",
      "A personal variant of a team skill goes in `~/.claude/skills/` **under a different name**, so teammates' `/review` stays untouched.",
      "`disable-model-invocation: true` stops Claude from triggering a skill by itself, e.g. one that posts to a pull request.",
    ],
    code: "---\nname: map-dependencies\ndescription: Map import dependencies of a legacy module\nargument-hint: [module-path]\ncontext: fork\nagent: Explore\nallowed-tools: Read, Grep, Glob\n---\nAnalyse $ARGUMENTS and return a short dependency summary.",
    traps: [
      { wrong: "Put a team workflow in `~/.claude/commands/` so everyone gets it.", right: "Home-directory files are personal. Team workflows go in the repo's `.claude/skills/` or `.claude/commands/`." },
      { wrong: "Edit the shared skill to add your personal checks.", right: "Create a differently named copy in `~/.claude/skills/`." },
      { wrong: "Ask the skill body to \"keep output short\" to protect the main context.", right: "`context: fork` isolates the output structurally; an instruction is only a request." },
    ],
    exam: "Match the need to one frontmatter key: noisy output → `context: fork`; no destructive actions → `allowed-tools`; missing parameter → `argument-hint`; team availability → project directory.",
    sources: [
      { label: "Extend Claude with skills", url: "https://code.claude.com/docs/en/skills" },
    ],
  },
  {
    id: "3.3",
    tldr: "A `.claude/rules/` file with a `paths:` glob loads only when Claude reads or edits a matching file. Globs follow file type across directories, which a subdirectory `CLAUDE.md` cannot do.",
    diagram: {
      kind: "compare",
      title: "Conventions for files scattered across the repo",
      columns: [
        { title: "Subdirectory CLAUDE.md", tone: "bad", items: [
          "Tied to one folder tree",
          "Test files in 30 folders → 30 copies to keep in sync",
          "Cannot select by file type",
        ] },
        { title: "Rule with `paths:` globs", tone: "good", items: [
          "One file: `.claude/rules/testing.md`",
          "`**/*.test.tsx` matches tests at any depth",
          "Loads only when a matching file is touched",
        ] },
      ],
    },
    points: [
      "Frontmatter `paths:` takes a list of **glob patterns**; the rule enters context when Claude reads or edits a matching file, and stays out otherwise.",
      "Benefit: less irrelevant context and fewer tokens. Move a large, rarely used section (e.g. migration conventions) out of the root `CLAUDE.md` into a scoped rule.",
      "`**` crosses any number of directories: `terraform/**/*` covers the whole tree; `**/Dockerfile` finds Dockerfiles at every depth; `lambdas/**/handler.ts` hits handlers but not neighbouring utilities.",
      "List several globs when one convention spans unrelated trees: `[\"src/api/**/*.ts\", \"lambdas/**/handler.ts\"]`.",
      "A rule file **without** `paths` loads at launch like `CLAUDE.md` — scoping is what makes it conditional.",
    ],
    code: "---\npaths:\n  - \"terraform/**/*\"\n  - \"**/*.tf\"\n---\n# Infrastructure conventions\n- Tag every resource with owner and cost-center.",
    traps: [
      { wrong: "Add a `CLAUDE.md` in every folder that contains tests.", right: "One path-scoped rule with `**/*.test.tsx` covers them all and cannot drift." },
      { wrong: "A path-scoped rule is loaded at launch and just ignored for other files.", right: "It is not loaded at all until a matching file is read or edited." },
      { wrong: "`*.tf` at the top level matches files in subfolders.", right: "Use `**/*.tf` to match at any depth." },
    ],
    exam: "Convention keyed to a file type or pattern spread across directories → `.claude/rules/` with `paths:` globs. Convention for one self-contained folder → a subdirectory `CLAUDE.md` is acceptable.",
    sources: [
      { label: "Manage Claude's memory", url: "https://code.claude.com/docs/en/memory" },
    ],
  },
  {
    id: "3.4",
    tldr: "Plan mode explores read-only and proposes a plan before any edit: use it for large, multi-file or architectural work with several valid approaches. A clear, single-spot fix goes straight to direct execution.",
    diagram: {
      kind: "decision",
      title: "Plan mode or direct execution?",
      question: "Is the scope clear and the approach obvious?",
      branches: [
        { when: "Yes — one file, known cause (stack trace)", then: "Direct execution", tone: "good" },
        { when: "No — many files, architectural, several approaches", then: "Plan mode, approve the plan, then execute", tone: "good" },
        { when: "Discovery will be huge (thousands of files)", then: "Explore subagent: verbose search stays out, summary comes back", tone: "accent" },
      ],
      caption: "Plan first when a wrong start means costly rework.",
    },
    points: [
      "**Plan mode**: `Shift+Tab` cycles default → `acceptEdits` → `plan`; from a script use `--permission-mode plan`. Claude reads and analyses, then presents a plan to approve; no file is edited.",
      "Plan-mode triggers: library migration across ~50 files, microservice restructuring, choosing between integration approaches with different infrastructure needs (webhook vs poller).",
      "**Direct execution** for well-understood, bounded changes: a null check where the stack trace points, a single date-validation conditional.",
      "**Combine**: plan the migration, approve it, then switch out of plan mode and execute the agreed approach.",
      "The built-in **Explore** subagent (read-only, like **Plan**) runs verbose discovery in its own context and returns a summary, protecting the main window during multi-phase tasks.",
    ],
    traps: [
      { wrong: "Use plan mode for everything to be safe.", right: "For a one-line, well-understood fix it only adds a round trip." },
      { wrong: "Run all discovery searches in the main session, then `/compact`.", right: "Delegate discovery to Explore up front so the window never fills with raw results." },
      { wrong: "Explore and Plan subagents can edit files once a plan is approved.", right: "Both are read-only; edits happen in the main session." },
    ],
    exam: "Look for scope signals: \"many files\", \"architectural\", \"two approaches\" → plan mode. \"Single file\", \"clear stack trace\" → direct. \"Context filling with search output\" → Explore subagent.",
    sources: [
      { label: "Permission modes", url: "https://code.claude.com/docs/en/permission-modes" },
      { label: "Common workflows", url: "https://code.claude.com/docs/en/common-workflows" },
    ],
  },
  {
    id: "3.5",
    tldr: "Iterate with evidence, not more prose: show 2–3 input/output examples, let failing tests drive fixes, have Claude interview you in unfamiliar domains, and batch issues only when their fixes interact.",
    diagram: {
      kind: "hub",
      title: "Pick the refinement technique for the symptom",
      center: { label: "Refine with Claude Code", sub: "replace ambiguity with something checkable" },
      spokes: [
        { label: "2–3 input/output examples", sub: "prose description read differently each run", tone: "good" },
        { label: "Tests first, share failures", sub: "behaviour, edge cases, performance targets", tone: "good" },
        { label: "Interview pattern", sub: "unfamiliar domain: Claude asks before building", tone: "accent" },
        { label: "One message vs one at a time", sub: "interacting issues together; independent ones in sequence", tone: "warn" },
      ],
    },
    points: [
      "**Concrete examples** beat a longer paragraph: when a transformation comes out different each run, give 2–3 real input → expected output pairs.",
      "**Test-driven iteration**: write tests for expected behaviour, edge cases and performance first, then paste the actual failures back. Each round has an objective target.",
      "For an edge-case bug (null `invoice_date` in a migration), give the specific input row and the expected output, not \"handle nulls better\".",
      "**Interview pattern**: ask Claude to question you before implementing (cache invalidation, failure modes, clock skew) to surface considerations you had not anticipated.",
      "**Interacting** problems (schema field, dedup key and comment poster all depend on `line`) go in **one** detailed message; **independent** ones are fixed sequentially so each change is verified alone.",
    ],
    traps: [
      { wrong: "Rewrite the description in more detail and run it again.", right: "If prose was misread, more prose rarely helps; examples or tests remove the ambiguity." },
      { wrong: "Reply \"tests fail, fix it\".", right: "Share the actual failing test output so Claude knows exactly what is wrong." },
      { wrong: "Always fix one issue per message.", right: "When fixes depend on each other, splitting them causes rework; send them together." },
    ],
    exam: "Choose the option that adds something verifiable — examples, tests, specific failing cases — over one that adds adjectives. For several issues, check whether the fixes interact before choosing one message vs sequential.",
    sources: [
      { label: "Common workflows", url: "https://code.claude.com/docs/en/common-workflows" },
      { label: "Multishot prompting", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/multishot-prompting" },
    ],
  },
  {
    id: "3.6",
    tldr: "In CI, run Claude Code with `-p` so it never waits for input, get machine-readable results with `--output-format json` plus `--json-schema`, and feed it project context through the committed `CLAUDE.md`.",
    diagram: {
      kind: "flow",
      title: "A CI review job",
      steps: [
        { label: "Context", sub: "committed `CLAUDE.md`, prior findings, existing tests", edge: "prompt" },
        { label: "`claude -p`", sub: "non-interactive: run, print, exit", tone: "accent", edge: "JSON" },
        { label: "`--json-schema` output", sub: "validated against your schema" },
        { label: "Post inline PR comments", sub: "only new or still-open issues", tone: "good" },
      ],
    },
    points: [
      "**`-p` / `--print`** is the non-interactive mode; without it the job can hang waiting for input. `CLAUDE_HEADLESS`, `--batch` and `--headless` are not real options.",
      "**`--output-format json`** (or `stream-json`) for parsing; **`--json-schema`** (print mode only) returns JSON validated against your schema, ready for inline comments.",
      "CI sees only committed files: testing standards, fixture conventions and review criteria belong in project `CLAUDE.md`, not `CLAUDE.local.md` or `~/.claude`.",
      "Re-runs after new commits: include the **prior findings** and ask for only new or still-unaddressed issues, so comments are not duplicated.",
      "Test generation: put the **existing test files** in context so Claude does not propose scenarios already covered; document valuable-test criteria and available fixtures.",
      "**Independent review**: the session that wrote the code keeps its own reasoning and is a weak reviewer of it. Review in a separate instance.",
    ],
    code: "claude -p \"Review this PR diff. Report only new or unresolved issues.\" \\\n  --output-format json \\\n  --json-schema \"$(cat review-schema.json)\" \\\n  --allowedTools \"Read,Grep,Glob\" --max-turns 10",
    traps: [
      { wrong: "Ask for JSON in the prompt and parse it with a regex.", right: "`--json-schema` enforces the structure; a prompt request is not a guarantee." },
      { wrong: "Ask the generating session to review its own changes before merge.", right: "Use a fresh instance without the generator's context." },
      { wrong: "Each re-run reviews from scratch with no history.", right: "Pass previous findings so only new or still-open issues are reported." },
    ],
    exam: "CI options to trust: `-p`, `--output-format json`, `--json-schema`, committed `CLAUDE.md`, a separate reviewer instance. Invented flags or env vars and \"ask for JSON politely\" are distractors.",
    sources: [
      { label: "Run Claude Code programmatically", url: "https://code.claude.com/docs/en/headless" },
      { label: "CLI reference", url: "https://code.claude.com/docs/en/cli-reference" },
      { label: "Claude Code GitHub Actions", url: "https://code.claude.com/docs/en/github-actions" },
    ],
  },
);

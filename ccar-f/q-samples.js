/* ============================================================================
   CCAR-F — the 12 sample questions published in Exam Guide v1.0, Section 9.
   Stems and options are VERBATIM. FROZEN: never reword. The explanations are
   ours, rewritten without the guide's option-letter references because the
   app shuffles options at draw time.
   ============================================================================ */
(window.CCARF_QUESTIONS = window.CCARF_QUESTIONS || []).push(
  {
    id: "F1.4-S1", domain: 1, skill: "1.4 Workflow enforcement and handoff", scenario: 1, official: true,
    kind: "scenario", difficulty: 2, src: "exam-guide-f-s9",
    q: "Production data shows that in 12% of cases, your agent skips get_customer entirely and calls lookup_order using only the customer's stated name, occasionally leading to misidentified accounts and incorrect refunds. What change would most effectively address this reliability issue?",
    options: [
      "Add a programmatic prerequisite that blocks lookup_order and process_refund calls until get_customer has returned a verified customer ID.",
      "Enhance the system prompt to state that customer verification via get_customer is mandatory before any order operations.",
      "Add few-shot examples showing the agent always calling get_customer first, even when customers volunteer order details.",
      "Implement a routing classifier that analyzes each request and enables only the subset of tools appropriate for that request type.",
    ],
    correct: 0,
    expl: "When a tool ordering protects money or identity, enforce it in code: a prerequisite gate makes the skip impossible rather than unlikely. Stronger prompt wording and few-shot examples are tempting but remain probabilistic — a 12% failure rate may shrink, never reach zero. A routing classifier changes which tools exist, not the order they are called in.",
  },
  {
    id: "F2.1-S2", domain: 2, skill: "2.1 Tool interface design", scenario: 1, official: true,
    kind: "scenario", difficulty: 2, src: "exam-guide-f-s9",
    q: "Production logs show the agent frequently calls get_customer when users ask about orders (e.g., \"check my order #12345\"), instead of calling lookup_order. Both tools have minimal descriptions (\"Retrieves customer information\" / \"Retrieves order details\") and accept similar identifier formats. What's the most effective first step to improve tool selection reliability?",
    options: [
      "Add few-shot examples to the system prompt demonstrating correct tool selection patterns, with 5-8 examples showing order-related queries routing to lookup_order.",
      "Expand each tool's description to include input formats it handles, example queries, edge cases, and boundaries explaining when to use it versus similar tools.",
      "Implement a routing layer that parses user input before each turn and pre-selects the appropriate tool based on detected keywords and identifier patterns.",
      "Consolidate both tools into a single lookup_entity tool that accepts any identifier and internally determines which backend to query.",
    ],
    correct: 1,
    expl: "Tool descriptions are what the model selects on, so two one-line descriptions over similar inputs are the root cause; enriching them is the cheapest, highest-leverage first fix. Few-shot examples are tempting but add tokens rather than fixing the descriptions, a keyword router bypasses the model's understanding, and merging the tools is a bigger redesign than a first step warrants.",
  },
  {
    id: "F5.2-S3", domain: 5, skill: "5.2 Escalation and ambiguity", scenario: 1, official: true,
    kind: "scenario", difficulty: 3, src: "exam-guide-f-s9",
    q: "Your agent achieves 55% first-contact resolution, well below the 80% target. Logs show it escalates straightforward cases (standard damage replacements with photo evidence) while attempting to autonomously handle complex situations requiring policy exceptions. What's the most effective way to improve escalation calibration?",
    options: [
      "Add explicit escalation criteria to your system prompt with few-shot examples demonstrating when to escalate versus resolve autonomously.",
      "Have the agent self-report a confidence score (1-10) before each response and automatically route requests to humans when confidence falls below a threshold.",
      "Deploy a separate classifier model trained on historical tickets to predict which requests need escalation before the main agent begins processing.",
      "Implement sentiment analysis to detect customer frustration levels and automatically escalate when negative sentiment exceeds a threshold.",
    ],
    correct: 0,
    expl: "The agent's decision boundary is unclear, so state it: explicit criteria plus examples of escalate-versus-resolve fix the root cause proportionately. Self-reported confidence is tempting but poorly calibrated — the agent is already confidently wrong on the hard cases. A trained classifier is premature infrastructure, and sentiment does not track case complexity.",
  },
  {
    id: "F3.2-S4", domain: 3, skill: "3.2 Slash commands and skills", scenario: 2, official: true,
    kind: "recall", difficulty: 1, src: "exam-guide-f-s9",
    q: "You want to create a custom /review slash command that runs your team's standard code review checklist. This command should be available to every developer when they clone or pull the repository. Where should you create this command file?",
    options: [
      "In the .claude/commands/ directory in the project repository",
      "In ~/.claude/commands/ in each developer's home directory",
      "In the CLAUDE.md file at the project root",
      "In a .claude/config.json file with a commands array",
    ],
    correct: 0,
    expl: "A command shared with the team must be version-controlled with the project, which is the project-scoped `.claude/commands/` directory. The home-directory location is personal and never travels with the repository. CLAUDE.md carries instructions and context, not command definitions, and a config.json commands array is not a Claude Code mechanism.",
  },
  {
    id: "F3.4-S5", domain: 3, skill: "3.4 Plan mode vs direct execution", scenario: 2, official: true,
    kind: "scenario", difficulty: 2, src: "exam-guide-f-s9",
    q: "You've been assigned to restructure the team's monolithic application into microservices. This will involve changes across dozens of files and requires decisions about service boundaries and module dependencies. Which approach should you take?",
    options: [
      "Enter plan mode to explore the codebase, understand dependencies, and design an implementation approach before making changes.",
      "Start with direct execution and make changes incrementally, letting the implementation reveal the natural service boundaries.",
      "Use direct execution with comprehensive upfront instructions detailing exactly how each service should be structured.",
      "Begin in direct execution mode and only switch to plan mode if you encounter unexpected complexity during implementation.",
    ],
    correct: 0,
    expl: "Large-scale, multi-file work with architectural decisions is exactly what plan mode is for: explore and design before committing to edits. Switching to plan mode only if complexity appears is tempting but ignores that the complexity is already stated in the task. Incremental direct edits risk costly rework, and detailed upfront instructions assume a structure nobody has explored yet.",
  },
  {
    id: "F3.3-S6", domain: 3, skill: "3.3 Path-specific rules", scenario: 2, official: true,
    kind: "scenario", difficulty: 2, src: "exam-guide-f-s9",
    q: "Your codebase has distinct areas with different coding conventions: React components use functional style with hooks, API handlers use async/await with specific error handling, and database models follow a repository pattern. Test files are spread throughout the codebase alongside the code they test (e.g., Button.test.tsx next to Button.tsx), and you want all tests to follow the same conventions regardless of location. What's the most maintainable way to ensure Claude automatically applies the correct conventions when generating code?",
    options: [
      "Create rule files in .claude/rules/ with YAML frontmatter specifying glob patterns to conditionally apply conventions based on file paths",
      "Consolidate all conventions in the root CLAUDE.md file under headers for each area, relying on Claude to infer which section applies",
      "Create skills in .claude/skills/ for each code type that include the relevant conventions in their SKILL.md files",
      "Place a separate CLAUDE.md file in each subdirectory containing that area's specific conventions",
    ],
    correct: 0,
    expl: "Path-scoped rules match by glob, so a pattern like `**/*.test.tsx` reaches every test file wherever it lives, and loads only when such a file is touched. Subdirectory CLAUDE.md files are the tempting answer but are bound to one directory, which cannot follow tests scattered across the tree. One big CLAUDE.md relies on inference, and skills are on-demand rather than automatic.",
  },
  {
    id: "F1.2-S7", domain: 1, skill: "1.2 Coordinator-subagent orchestration", scenario: 3, official: true,
    kind: "scenario", difficulty: 2, src: "exam-guide-f-s9",
    q: "After running the system on the topic \"impact of AI on creative industries,\" you observe that each subagent completes successfully: the web search agent finds relevant articles, the document analysis agent summarizes papers correctly, and the synthesis agent produces coherent output. However, the final reports cover only visual arts, completely missing music, writing, and film production. When you examine the coordinator's logs, you see it decomposed the topic into three subtasks: \"AI in digital art creation,\" \"AI in graphic design,\" and \"AI in photography.\" What is the most likely root cause?",
    options: [
      "The synthesis agent lacks instructions for identifying coverage gaps in the findings it receives from other agents.",
      "The coordinator agent's task decomposition is too narrow, resulting in subagent assignments that don't cover all relevant domains of the topic.",
      "The web search agent's queries are not comprehensive enough and need to be expanded to cover more creative industry sectors.",
      "The document analysis agent is filtering out sources related to non-visual creative industries due to overly restrictive relevance criteria.",
    ],
    correct: 1,
    expl: "The logs show the coordinator split the topic into three visual-arts subtasks, so the gap was created at decomposition and every downstream agent faithfully did what it was assigned. Blaming the search queries is tempting because that is where coverage seems to appear, but the search agent never received music, writing or film to search for.",
  },
  {
    id: "F5.3-S8", domain: 5, skill: "5.3 Error propagation", scenario: 3, official: true,
    kind: "scenario", difficulty: 2, src: "exam-guide-f-s9",
    q: "The web search subagent times out while researching a complex topic. You need to design how this failure information flows back to the coordinator agent. Which error propagation approach best enables intelligent recovery?",
    options: [
      "Return structured error context to the coordinator including the failure type, the attempted query, any partial results, and potential alternative approaches.",
      "Implement automatic retry logic with exponential backoff within the subagent, returning a generic \"search unavailable\" status only after all retries are exhausted.",
      "Catch the timeout within the subagent and return an empty result set marked as successful.",
      "Propagate the timeout exception directly to a top-level handler that terminates the entire research workflow.",
    ],
    correct: 0,
    expl: "The coordinator can only choose between retrying, rephrasing or proceeding with partial results if it is told what failed and what was already gathered. Retrying then returning a generic status is tempting but throws that context away. Reporting an empty success hides the failure entirely, and killing the whole workflow over one timeout wastes everything else.",
  },
  {
    id: "F2.3-S9", domain: 2, skill: "2.3 Tool distribution and tool_choice", scenario: 3, official: true,
    kind: "scenario", difficulty: 3, src: "exam-guide-f-s9",
    q: "During testing, you observe that the synthesis agent frequently needs to verify specific claims while combining findings. Currently, when verification is needed, the synthesis agent returns control to the coordinator, which invokes the web search agent, then re-invokes synthesis with results. This adds 2-3 round trips per task and increases latency by 40%. Your evaluation shows that 85% of these verifications are simple fact-checks (dates, names, statistics) while 15% require deeper investigation. What's the most effective approach to reduce overhead while maintaining system reliability?",
    options: [
      "Give the synthesis agent a scoped verify_fact tool for simple lookups, while complex verifications continue delegating to the web search agent through the coordinator.",
      "Have the synthesis agent accumulate all verification needs and return them as a batch to the coordinator at the end of its pass, which then sends them all to the web search agent at once.",
      "Give the synthesis agent access to all web search tools so it can handle any verification need directly without round-trips through the coordinator.",
      "Have the web search agent proactively cache extra context around each source during initial research, anticipating what the synthesis agent might need to verify.",
    ],
    correct: 0,
    expl: "A narrow verify_fact tool removes the round trips for the 85% common case while the coordinator still handles deep investigations — least privilege applied to a measured need. Handing over every search tool is tempting because it removes all round trips, but it over-provisions the synthesis agent and blurs specialisation. Batching blocks on dependent facts, and speculative caching cannot predict what will need checking.",
  },
  {
    id: "F3.6-S10", domain: 3, skill: "3.6 Claude Code in CI/CD", scenario: 5, official: true,
    kind: "recall", difficulty: 1, src: "exam-guide-f-s9",
    q: "Your pipeline script runs claude \"Analyze this pull request for security issues\" but the job hangs indefinitely. Logs indicate Claude Code is waiting for interactive input. What's the correct approach to run Claude Code in an automated pipeline?",
    options: [
      "Add the -p flag: claude -p \"Analyze this pull request for security issues\"",
      "Set the environment variable CLAUDE_HEADLESS=true before running the command",
      "Redirect stdin from /dev/null: claude \"Analyze this pull request for security issues\" < /dev/null",
      "Add the --batch flag: claude --batch \"Analyze this pull request for security issues\"",
    ],
    correct: 0,
    expl: "`-p` (`--print`) is the documented non-interactive mode: it runs the prompt, prints the result and exits. Redirecting stdin is the tempting Unix reflex but does not put Claude Code into its headless mode. The environment variable and the batch flag sound plausible yet are not Claude Code features.",
  },
  {
    id: "F4.5-S11", domain: 4, skill: "4.5 Batch processing", scenario: 5, official: true,
    kind: "scenario", difficulty: 2, src: "exam-guide-f-s9",
    q: "Your team wants to reduce API costs for automated analysis. Currently, real-time Claude calls power two workflows: (1) a blocking pre-merge check that must complete before developers can merge, and (2) a technical debt report generated overnight for review the next morning. Your manager proposes switching both to the Message Batches API for its 50% cost savings. How should you evaluate this proposal?",
    options: [
      "Use batch processing for the technical debt reports only; keep real-time calls for pre-merge checks.",
      "Switch both workflows to batch processing with status polling to check for completion.",
      "Keep real-time calls for both workflows to avoid batch result ordering issues.",
      "Switch both to batch processing with a timeout fallback to real-time if batches take too long.",
    ],
    correct: 0,
    expl: "Batches can take up to 24 hours with no latency guarantee, which suits an overnight report but not a check developers are blocked on. A timeout fallback to real time is tempting but adds machinery to rescue a workload that should never have been batched. Result ordering is not a reason to avoid batches either — results are correlated by `custom_id`.",
  },
  {
    id: "F4.6-S12", domain: 4, skill: "4.6 Multi-instance and multi-pass review", scenario: 5, official: true,
    kind: "scenario", difficulty: 2, src: "exam-guide-f-s9",
    q: "A pull request modifies 14 files across the stock tracking module. Your single-pass review analyzing all files together produces inconsistent results: detailed feedback for some files but superficial comments for others, obvious bugs missed, and contradictory feedback—flagging a pattern as problematic in one file while approving identical code elsewhere in the same PR. How should you restructure the review?",
    options: [
      "Split into focused passes: analyze each file individually for local issues, then run a separate integration-focused pass examining cross-file data flow.",
      "Require developers to split large PRs into smaller submissions of 3-4 files before the automated review runs.",
      "Switch to a higher-tier model with a larger context window to give all 14 files adequate attention in one pass.",
      "Run three independent review passes on the full PR and only flag issues that appear in at least two of the three runs.",
    ],
    correct: 0,
    expl: "Uneven depth and contradictions across 14 files are attention dilution; per-file passes give each file consistent focus and a separate integration pass catches cross-file issues. A bigger context window is tempting but more room does not mean more attention per file. Majority voting suppresses intermittently caught real bugs, and forcing smaller PRs moves the burden onto developers.",
  },
);

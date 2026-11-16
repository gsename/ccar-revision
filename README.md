# CCAR Revision — Claude Certified Architect, Foundations & Professional

Two offline study apps in one repo, for the **CCAR-F** (Foundations) and **CCAR-P** (Professional)
certifications (Exam Guides v1.0, July 2026). Each has a practice bank, a mock exam that follows the real
exam's blueprint weights and scoring, and drills by domain, objective and (for CCAR-F) scenario.

## Open it

Double-click **`index.html`** and pick a certification. There is no server, no build step and no
network. The pages run straight from the filesystem, and the same files are served as-is by GitHub Pages.

## Views (both certifications)

- **Home** — exam facts, blueprint weights, the guide's "How to Prepare" list, and your last mock score.
  Also two buttons: a **10-question diagnostic** (2 questions per domain, over 5 domains) and
  **Weak spots**.
- **Domains** — each domain with a summary and key takeaways. Each task statement or objective shows the
  **exam guide's own wording, verbatim**, and has a practice button.
- **Scenarios** (CCAR-F only) — the 6 exam scenarios, verbatim, each with a practice button.
- **Mock exam** — a weighted draw scored on the 100–1000 scale, with 720 to pass. Correction comes at the
  end. There is an optional timer, a per-domain breakdown and a full review.
- **Practice** — immediate correction. Filter by domain, by task statement or objective, and by scenario.
- **Flashcards** and **Cheat sheet** — optional extras that sit on top of the bank.

Light and dark themes are available. History is stored in `localStorage`, in a separate key per
certification. **Weak spots** keeps the id of every question you got wrong and drops it once you get it
right.

## Mock exam: how it works

**Weighted draw.** Questions are allocated across the domains by largest remainder. The tie-break is
deterministic: larger weight first, then lower domain id.

| Exam | Length | Allocation by domain |
|---|---|---|
| CCAR-F | 60 | D1 16 · D2 11 · D3 12 · D4 12 · D5 9 |
| CCAR-F | 20 | D1 5 · D2 4 · D3 4 · D4 4 · D5 3 |
| CCAR-P | 63 | D1 11 · D2 8 · D3 12 · D4 10 · D5 9 · D6 9 · D7 4 |
| CCAR-P | 20 | D1 3 · D2 3 · D3 4 · D4 3 · D5 3 · D6 3 · D7 1 |

**CCAR-F scenarios.** The real exam presents 4 scenarios drawn from a bank of 6. The guide lists only
multiple-choice and multiple-response items, so this structure needs no new item type. Each CCAR-F
question carries a `scenario` field.

The mock exam works like this:
1. It picks 4 of the 6 scenarios at random.
2. It draws each domain's allocation from those 4 scenarios only.
3. It presents the questions grouped by scenario. The scenario text appears in full at the start of each
   group, and as a collapsible reminder on the questions after it.

The validator checks all 15 possible combinations of 4 scenarios and confirms that each one can fill a
full 60-item exam.

**Scaled score.** `scaled = 100 + (correct / total) × 900`, so 720 sits at **68.9%** correct. That is
42/60 for CCAR-F and 44/63 for CCAR-P. The real exams use scaled scores set by a standard-setting study,
so treat this number as a calibration aid, not a prediction. As on the real score report, the
per-domain percentages are for information only.

**Answer order is shuffled on every attempt**, and the correct answers are remapped to their new
positions.

## Question banks

**CCAR-F — 240 items** (12 of them are the guide's own samples)

| Domain | Weight | Items | | Scenario | Items |
|---|---|---|---|---|---|
| 1 · Agentic Architecture & Orchestration | 27% | 64 | | 1 · Customer Support Resolution Agent | 40 |
| 2 · Tool Design & MCP Integration | 18% | 44 | | 2 · Code Generation with Claude Code | 40 |
| 3 · Claude Code Configuration & Workflows | 20% | 48 | | 3 · Multi-Agent Research System | 42 |
| 4 · Prompt Engineering & Structured Output | 20% | 48 | | 4 · Developer Productivity with Claude | 40 |
| 5 · Context Management & Reliability | 15% | 36 | | 5 · Claude Code for Continuous Integration | 42 |
| | | | | 6 · Structured Data Extraction | 36 |

Each task statement has 6–10 items. Within a scenario, items lean towards that scenario's
"primary domains" as listed in the guide.

**CCAR-P — 252 items** (3 of them are the guide's own samples)

| Domain | Weight | Items |
|---|---|---|
| 1 · Solution Design & Architecture | 17% | 44 |
| 2 · Claude Models, Prompting & Context Engineering | 13% | 32 |
| 3 · Integration | 19% | 48 |
| 4 · Evaluation, Testing & Optimization | 16% | 40 |
| 5 · Governance, Safety & Risk Management | 14% | 36 |
| 6 · Stakeholder Communication & Lifecycle Management | 14% | 36 |
| 7 · Developer Productivity & Operational Enablement | 7% | 16 |

Each objective has 5–8 items.

**Pool size.** Each domain's pool is 4× its allocation in a full-length exam. Two consecutive mock
exams therefore share about **25%** of their items at full length, and about **8%** at 20 questions.

**Validator figures** (as printed by `tools/check-bank.mjs`):

| | CCAR-F | CCAR-P |
|---|---|---|
| Errors (strict mode) | 0 | 0 |
| Score from always picking the **longest** option | 20.0% | 17.9% |
| Score from always picking the **shortest** option | 27.9% | 19.4% |
| Longest option is the correct one (single answer) | 18.4% | 18.4% |
| Multiple-response items | 22 (9.2%) | 21 (8.3%) |
| Scenario / recall mix | 73 / 27 | 71 / 29 |

A reader who knows nothing about the content therefore scores about what blind guessing gives (around 24%), far
below the 68.9% pass threshold. The only warnings left are informational: some task statements and
objectives have fewer than 8 items, because each is under 3% of the exam.

Every item:
- carries **one distractor that encodes an outdated practice** still taught in older material, such as
  "Claude Code SDK", SSE for remote MCP, assistant prefill or regex-parsed JSON, a fixed `budget_tokens`,
  a generic "Operation failed" error, sentiment-based escalation, or a shared admin key for an agent;
- has an explanation that states the rule, then why the most tempting distractor fails.

**The published samples break the length rule.** In the guides' own samples, the correct answer is
often the longest option: 7 of the 12 CCAR-F samples and 2 of the 3 CCAR-P samples. The bank's rule is
deliberately stricter, so you train against the harder case. The validator exempts the samples and
reports their ratios separately.

## Validating the banks

```
node tools/check-bank.mjs --cert f            # CCAR-F report; fails only on real errors
node tools/check-bank.mjs --cert p --strict   # also fails on target-count shortfalls
node tools/file-stats.mjs ccar-f/q-d2.js      # quick per-file authoring stats
```

The validator checks:
- **Composition**: counts against target per domain, per task statement or objective, and per scenario.
- **Item structure**: option counts, correct indexes, and that "(Select N)" in the stem matches the
  number of correct answers.
- **Explanations**: length, a contrast word, and no reference to an option letter.
- **Content rules**: no catch-all options, one outdated-practice distractor per item, a `src` on every
  item, and no churn-prone identifier (model id, dated tool type, dated beta header) as a correct answer.
- **The length tell**: if the correct answer is consistently the longest option, the tell survives
  shuffling. The validator rejects any item whose longest option is more than 1.6× its shortest, and
  reports the score of a candidate who **always picks the longest option**.
- **Scenario feasibility** (CCAR-F): every combination of 4 scenarios can fill a full exam.

Each item's `src` points to a section of `tools/facts.md`, the frozen fact sheet the bank was written
against. That file is **local and unpublished** (it is gitignored), because it summarises Anthropic
documentation and the app does not need it at runtime.

## Where the exam guides and current documentation disagree

The guides are dated July 2026. Where they differ from the current Anthropic documentation, the bank
follows the documentation. An exam item may still use the guide's wording.

1. **`Task` → `Agent`.** The guide says a coordinator's `allowedTools` must include `"Task"`. The
   subagent tool is now named `Agent`, and `Task` is still accepted as an alias. Items say "the Agent
   (formerly Task) tool".
2. **Subagents and context.** The guide says subagents never inherit the parent's context. That is true
   for default subagents, but *fork* subagents inherit the conversation.
3. **Commands and skills.** Custom slash commands have been merged into skills. `.claude/commands/`
   still works, and the project-versus-personal scoping in the guide still holds.
4. **Forced `tool_choice`.** The guide recommends `tool_choice: "any"` or a forced tool for structured
   output. Current documentation rejects forced choice with manual extended thinking and on the newest
   models, and points to structured outputs (`output_config.format`, `strict: true`). Items test the
   semantics of `tool_choice` rather than treating it as the only route.
5. **Agent SDK settings.** The SDK now loads filesystem settings (CLAUDE.md, rules, skills) by default.
   `settingSources: []` turns this off.
6. **PostToolUse.** `updatedToolOutput` works for every tool. `updatedMCPToolOutput` is the older field
   and covers MCP tools only.

Before you sit an exam, re-check anything that moves: tool and flag names, per-model cache minimums, and
which model tiers accept forced `tool_choice`.

## Files

| File | Role |
|---|---|
| `index.html` | Landing page: pick a certification |
| `shared/app.js` | Engine shared by both certifications (views, weighted and scenario draw, scoring) |
| `shared/styles.css` | Design tokens, light/dark themes, components |
| `ccar-*/index.html` | Page shell and script load order |
| `ccar-*/blueprint.js` | Verbatim exam-guide content (objectives, scenarios, prep list). Frozen. |
| `ccar-*/q-samples.js` | The published sample questions (12 for CCAR-F, 3 for CCAR-P), verbatim. Frozen. |
| `ccar-*/q-d*.js` | The practice bank, one file per domain (CCAR-F D1 is split in two) |
| `ccar-*/data.js` | Exam facts, domain summaries, takeaways, flashcards; assembles `window.CERT` |
| `tools/check-bank.mjs` | Bank validator (not loaded by the pages) |
| `tools/file-stats.mjs` | Per-file authoring stats |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is |

## Sources

- The two public exam guides (v1.0, July 2026): blueprints, scenarios, objectives and sample questions.
- Anthropic documentation (platform.claude.com, code.claude.com) and the MCP specification.
- [aicertguides.com](https://aicertguides.com/) for UX ideas only: the diagnostic first, one practice
  entry per task statement, and the weak-spot drill. No content was taken from it.
- The Anthropic Partner Academy course pages require a login and were not used.

---

> The practice questions are **not** from the official question banks. They were written for revision
> from the public exam guides and the Anthropic documentation. Items badged "exam-guide sample" are the
> examples published in the guides themselves, with their stems and options unchanged.

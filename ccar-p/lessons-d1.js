/* ============================================================================
   CCAR-P lessons — Domain 1: Solution Design & Architecture
   One short lesson per objective. Written from tools/facts.md and the public
   Exam Guide v1.0. Schema: see tools/check-lessons.mjs.
   ============================================================================ */
window.CCARP_LESSONS = window.CCARP_LESSONS || [];
window.CCARP_LESSONS.push(
  {
    id: "1.3",
    tldr: "Pick the least autonomous pattern that meets the requirement: a single augmented call, then a fixed workflow, and an agent only when the steps cannot be known in advance.",
    diagram: {
      kind: "decision",
      title: "Which architectural pattern?",
      question: "Can you write the steps down before the request arrives?",
      branches: [
        { when: "One step is enough", then: "Augmented LLM — one call + retrieval, tools, memory", tone: "good" },
        { when: "Yes, the path is fixed", then: "Workflow — chaining, routing, parallelization…", tone: "good" },
        { when: "No, the path depends on findings", then: "Agent — the model picks its next tool in a loop", tone: "warn" },
      ],
      caption: "Each step to the right adds cost, latency and new failure modes. Climb only when evals show the simpler pattern falls short.",
    },
    points: [
      "**Augmented LLM**: one model call enriched with retrieval, tools and memory. It is the building block of every other pattern.",
      "**Workflows** follow code paths you wrote: prompt chaining, routing, parallelization (sectioning or voting), orchestrator-workers, evaluator-optimizer.",
      "**Agents** choose their own path in a loop. They suit open-ended problems, but cost more, are slower, and their errors compound.",
      "Agent go/no-go: **complexity**, **value**, **viability** and **cost of error**. A \"no\" on any one means stay at a simpler tier.",
    ],
    table: {
      head: ["Pattern", "Use it when", "Example"],
      rows: [
        ["Prompt chaining", "Fixed sequence, each step checkable", "Draft → check against policy → translate"],
        ["Routing", "Distinct input types need different handling", "Billing vs technical tickets"],
        ["Parallelization", "Independent sub-tasks, or several votes", "Review sections in parallel"],
        ["Orchestrator-workers", "Sub-tasks only known at run time", "Code change touching unknown files"],
        ["Evaluator-optimizer", "Clear quality criteria, iteration helps", "Generate → critique → revise"],
      ],
    },
    traps: [
      { wrong: "Use an agent because the business owner asked for \"AI that decides\".", right: "Recommend the simplest pattern that meets the measured need, and say why in business terms." },
      { wrong: "Prompt chaining is too slow, so always run everything in one call.", right: "Chaining trades latency for accuracy and auditability; that is often the right trade." },
    ],
    exam: "When the scenario's steps are predictable or audit matters, the answer is a workflow. An agent is right only when the path truly depends on what is discovered.",
    sources: [
      { label: "Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
    ],
  },
);

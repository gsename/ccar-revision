/* ============================================================================
   CCAR-P — the 3 sample questions published in Exam Guide v1.0, Section 8.
   Stems and options are VERBATIM. FROZEN: never reword. The explanations are
   ours, rewritten without option-letter references (options are shuffled).
   ============================================================================ */
window.CCARP_QUESTIONS = window.CCARP_QUESTIONS || [];
window.CCARP_QUESTIONS.push(
  {
    id: "P3.1-S1", domain: 3, skill: "3.1 Capability bloat", official: true,
    kind: "scenario", difficulty: 2, src: "exam-guide-p-s8",
    q: "A team exposes a customer-support agent that can read tickets, draft replies, issue refunds, and delete user accounts. Support staff only ever need to read tickets and draft replies. Applying least-privilege principles, which change best reduces risk?",
    options: [
      "Add logging to the refund and delete tools so misuse can be audited later.",
      "Remove the refund and delete tools from the agent's configuration entirely.",
      "Keep all tools but add a confirmation prompt before refunds and deletions.",
      "Replace the agent with a larger model that follows instructions more reliably.",
    ],
    correct: 1,
    expl: "Least privilege removes capabilities the role never needs, so the attack surface disappears instead of being watched. A confirmation step is tempting but it is a compensating control: the dangerous tools are still reachable, for example through prompt injection. Logging only detects misuse after the fact, and model size has nothing to do with authorisation scope.",
  },
  {
    id: "P2.5-S2", domain: 2, skill: "2.5 Prompt reuse", official: true,
    kind: "scenario", difficulty: 2, src: "exam-guide-p-s8",
    q: "An application sends the same 8,000-token system prompt and policy document on every request, followed by a short, varying user message. Latency and cost are both concerns. Which optimization most directly addresses both?",
    options: [
      "Truncate the policy document to the first 1,000 tokens.",
      "Switch to the smallest available model regardless of task fit.",
      "Place the static system prompt and policy before the dynamic content and enable prompt caching.",
      "Move the policy document into a few-shot example block.",
    ],
    correct: 2,
    expl: "A large stable prefix followed by a small varying suffix is the textbook case for prompt caching: cached reads cut both input cost and time-to-first-token without dropping any context. Truncating the policy is tempting because it shrinks tokens too, but it throws away required instructions. Downsizing blindly risks quality, and relabelling the policy as few-shot creates no reusable prefix.",
  },
  {
    id: "P4.4-S3", domain: 4, skill: "4.4 Diagnosing issues", official: true,
    kind: "scenario", difficulty: 2, src: "exam-guide-p-s8",
    q: "A RAG system suddenly returns confident but incorrect answers after a document refresh, while latency and model version are unchanged. What is the most likely first place to investigate?",
    options: [
      "The model weights have silently changed.",
      "The retrieval/indexing step is returning irrelevant or stale chunks.",
      "The temperature setting is too low.",
      "The context window has shrunk.",
    ],
    correct: 1,
    expl: "The only thing that changed is the corpus, so suspect what consumes it: a broken re-index or mismatched embeddings feeding the model poor chunks it then answers from confidently. Silent weight changes are the tempting culprit for any sudden regression, but the model version is stated as unchanged. Temperature and window size are not triggered by a document refresh.",
  },
);

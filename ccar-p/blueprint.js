/* ============================================================================
   CCAR-P blueprint — VERBATIM from the public Exam Guide v1.0 (July 2026).
   FROZEN: do not reword. The guide publishes objectives only (no knowledge /
   skills breakdown and no per-objective weight). data.js reads this file.
   ============================================================================ */
window.CCARP_BLUEPRINT = {
  domains: [
    { id: 1, nom: "Solution Design & Architecture", poids: 17, objectives: [
      { id: "1.1", short: "Business problem to solution", title: "Translate business problems into Claude-based AI solutions" },
      { id: "1.2", short: "End-to-end architecture", title: "Design end-to-end architectures (input → processing → output → feedback loops)" },
      { id: "1.3", short: "Architectural patterns", title: "Select appropriate architectural patterns (workflow, agentic, augmented LLM)" },
      { id: "1.4", short: "Multi-agent design", title: "Design multi-agent systems and orchestration strategies" },
      { id: "1.5", short: "Decomposition", title: "Apply decomposition techniques for complex problem solving" },
      { id: "1.6", short: "Business value alignment", title: "Align solutions to business value pillars (efficiency, transformation, productivity, cost, performance SLAs)" },
    ] },
    { id: 2, nom: "Claude Models, Prompting & Context Engineering", poids: 13, objectives: [
      { id: "2.1", short: "Model selection", title: "Select appropriate Claude models based on trade-offs" },
      { id: "2.2", short: "System prompts and guardrails", title: "Design system prompts, templates, and guardrails" },
      { id: "2.3", short: "Prompting techniques", title: "Apply prompt engineering techniques (zero-shot, few-shot, chain-of-thought)" },
      { id: "2.4", short: "Context window and tokens", title: "Optimize context windows and manage token usage" },
      { id: "2.5", short: "Prompt reuse", title: "Implement prompt reuse strategies (caching, modular prompts, Skills)" },
    ] },
    { id: 3, nom: "Integration", poids: 19, objectives: [
      { id: "3.1", short: "Capability bloat", title: "Evaluate tool/agent configuration for capability bloat" },
      { id: "3.2", short: "AuthN/AuthZ gaps", title: "Analyze authentication and authorization requirements to identify security gaps" },
      { id: "3.3", short: "Accuracy-latency trade-offs", title: "Evaluate accuracy-latency trade-offs and justify configuration decisions" },
      { id: "3.4", short: "Observability at scale", title: "Analyze observability challenges and select monitoring strategies at scale" },
      { id: "3.5", short: "RAG pipeline design", title: "Design a RAG pipeline with appropriate chunking and indexing strategies" },
      { id: "3.6", short: "Retrieval strategy", title: "Apply retrieval strategies matched to data shape and query pattern" },
      { id: "3.7", short: "Integration mechanism", title: "Evaluate connection protocols and select the appropriate integration mechanism (MCP, API/CLI, agent-to-agent)" },
      { id: "3.8", short: "Progressive discovery", title: "Evaluate progressive discovery vs. monolithic context strategy" },
    ] },
    { id: 4, nom: "Evaluation, Testing & Optimization", poids: 16, objectives: [
      { id: "4.1", short: "Evaluation metrics", title: "Define evaluation metrics (accuracy, latency, cost, safety, security)" },
      { id: "4.2", short: "Eval datasets and frameworks", title: "Design evaluation datasets and test frameworks using mixed methodologies" },
      { id: "4.3", short: "A/B testing", title: "Conduct A/B testing and iterative improvements" },
      { id: "4.4", short: "Diagnosing issues", title: "Diagnose system issues (prompt failure, hallucinations, model mismatch)" },
      { id: "4.5", short: "Cost-performance optimization", title: "Optimize token usage, latency, and cost-performance trade-offs" },
      { id: "4.6", short: "Monitoring", title: "Monitor system performance using logging and observability tools" },
    ] },
    { id: 5, nom: "Governance, Safety & Risk Management", poids: 14, objectives: [
      { id: "5.1", short: "Guardrails", title: "Implement guardrails and safety controls" },
      { id: "5.2", short: "Risks and failure modes", title: "Identify risks, limitations, and failure modes of LLM systems" },
      { id: "5.3", short: "Human-in-the-loop", title: "Apply human-in-the-loop validation strategies" },
      { id: "5.4", short: "Regulatory compliance", title: "Ensure compliance with regulations (e.g., GDPR, HIPAA, FedRAMP)" },
      { id: "5.5", short: "Ethical AI", title: "Address ethical AI considerations (bias, fairness, transparency)" },
    ] },
    { id: 6, nom: "Stakeholder Communication & Lifecycle Management", poids: 14, objectives: [
      { id: "6.1", short: "Structured discovery", title: "Conduct structured discovery and requirement gathering" },
      { id: "6.2", short: "Communicating trade-offs", title: "Communicate architectural decisions and trade-offs" },
      { id: "6.3", short: "Feedback loops and SLAs", title: "Manage stakeholder feedback loops and expectation alignment (including SLAs)" },
      { id: "6.4", short: "Documentation and guidance", title: "Document architectures and provide implementation guidance" },
      { id: "6.5", short: "Lifecycle phases", title: "Support lifecycle phases (discovery, design, handoff, monitoring, iteration)" },
    ] },
    { id: 7, nom: "Developer Productivity & Operational Enablement", poids: 7, objectives: [
      { id: "7.1", short: "Team tooling setup", title: "Configure Claude tools and environments for teams (e.g., Claude Code)" },
      { id: "7.2", short: "AI-assisted workflows", title: "Improve developer workflows using AI-assisted tooling" },
      { id: "7.3", short: "Debugging and ops", title: "Support debugging and operational issue resolution" },
    ] },
  ],

  capabilities: [
    "Design and prototype AI-driven solutions that address real business problems",
    "Select appropriate models, architectures, and API patterns for specific use cases",
    "Implement prompt engineering and context strategies to guide model behavior",
    "Integrate Claude into production systems using APIs, orchestration tools, and data pipelines",
    "Apply evaluation, monitoring, and observability practices to ensure solution quality",
    "Incorporate security, compliance, and governance considerations into system design",
    "Collaborate with cross-functional stakeholders and communicate architectural decisions effectively",
  ],

  prep: [
    "Study the exam blueprint in Section 6 and self-assess against each objective",
    "Review official Anthropic documentation for the Claude API, models, prompt engineering, MCP, and Skills",
    "Build and operate at least one end-to-end Claude solution, including RAG, evaluation, and observability",
    "Practice architectural decision-making: model selection, integration protocols, and security trade-offs",
    "Complete the sample questions in Section 8 to familiarize yourself with item style",
  ],
};

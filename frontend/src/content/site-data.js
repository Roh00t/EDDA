export const siteStats = [
  { label: "Analyses completed this month", value: 38420, suffix: "+" },
  { label: "Evidence-backed signal precision", value: 93, suffix: "%" },
  { label: "Average report generation time", value: 47, suffix: "s" },
  { label: "Teams using EDDA weekly", value: 1260, suffix: "+" },
];

export const platformSignals = [
  {
    title: "Trust ledger by default",
    description:
      "Every claim is annotated as verified source, inferred from posting, or no data found so hiring decisions stay audit-friendly.",
    callout: "Transparent provenance",
  },
  {
    title: "Posting and employer intelligence",
    description:
      "EDDA pairs textual red-flag detection with grounded employer research so users can separate role risk from company risk.",
    callout: "Dual-signal architecture",
  },
  {
    title: "Analyst-grade evidence packaging",
    description:
      "Signal cards include plain-language explanations, quote excerpts, and source links so reviewers can validate conclusions quickly.",
    callout: "Evidence-first workflow",
  },
  {
    title: "Fast integration path",
    description:
      "Start with browser-based analysis, then graduate to API-backed pipelines and recurring policy checks without changing your model.",
    callout: "Built to scale",
  },
];

export const workflowSteps = [
  {
    id: "01",
    title: "Paste the role posting",
    body: "Drop in a plain job description. EDDA extracts role context, compensation disclosure, and hiring requirement signals.",
  },
  {
    id: "02",
    title: "Run trust analysis",
    body: "The engine scores posting flags, resolves employer identity, and attempts web-grounded verification where possible.",
  },
  {
    id: "03",
    title: "Review a structured report",
    body: "Teams receive a digestible signal summary, explicit caveats, and drill-down evidence for each surfaced claim.",
  },
  {
    id: "04",
    title: "Decide with confidence",
    body: "Use the report to triage opportunities, annotate recruiting notes, and make consistent go or no-go decisions.",
  },
];

export const pricingTiers = [
  {
    name: "Starter",
    price: "$49",
    cadence: "/mo",
    description: "For solo applicants and career coaches running lightweight diligence.",
    features: ["150 analyses / month", "Mock + live report modes", "CSV export"],
  },
  {
    name: "Growth",
    price: "$199",
    cadence: "/mo",
    highlighted: true,
    description: "For recruiting teams that need consistent, reviewable hiring intelligence.",
    features: ["2,000 analyses / month", "Team workspaces", "Priority signal retrieval", "Shared decision notes"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    description: "For companies embedding EDDA in internal governance and procurement flows.",
    features: ["Unlimited analyses", "SAML SSO", "Dedicated support", "Custom policy checks"],
  },
];

export const footerColumns = [
  {
    heading: "Product",
    links: ["Workbench", "Trust ledger", "API", "Changelog"],
  },
  {
    heading: "Company",
    links: ["About", "Security", "Customers", "Careers"],
  },
  {
    heading: "Resources",
    links: ["Docs", "Guides", "Support", "Status"],
  },
];

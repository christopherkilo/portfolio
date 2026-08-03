export const SITE = {
  name: "NovaTech Solutions",
  tagline: "Managed IT that keeps teams working",
  description:
    "NovaTech Solutions is a fictional managed IT provider for small and mid-sized businesses that need less downtime, safer systems, predictable support, and clearer technology planning.",
  audience:
    "Designed for growing teams without a full-time IT department—professional services, clinics, retail, and hybrid offices.",
  phone: "(555) 014-2200",
  email: "hello@novatech.example",
  address: "480 Innovation Drive, Suite 200, Austin, TX 78701",
  hours: "Mon–Fri 8:00 AM – 6:00 PM",
  copyright: `© ${new Date().getFullYear()} NovaTech Solutions. All rights reserved.`,
  demoNotice:
    "Fictional company website demo — illustrative content only. No live client data, certifications, or contractual claims.",
} as const;

export const DEMO_BASE = "/demos/novatech-solutions";

export const CTA = {
  primary: "Request a consultation",
  exploreServices: "Explore services",
  viewWork: "View example work",
  learnProcess: "Learn about our process",
  contact: "Contact NovaTech",
  learnMore: "Learn more",
} as const;

export const NAV_LINKS = [
  { href: DEMO_BASE, label: "Home" },
  { href: `${DEMO_BASE}/about`, label: "About" },
  { href: `${DEMO_BASE}/services`, label: "Services" },
  { href: `${DEMO_BASE}/portfolio`, label: "Portfolio" },
  { href: `${DEMO_BASE}/faq`, label: "FAQ" },
  { href: `${DEMO_BASE}/contact`, label: "Contact" },
] as const;

export type ServiceIconName =
  | "Server"
  | "Wrench"
  | "Network"
  | "ShieldCheck"
  | "Code2"
  | "Cloud";

export type ServiceEngagement = "ongoing" | "project" | "hybrid";
export type ServiceFocus = "preventive" | "reactive" | "both";
export type ServiceDomain = "infrastructure" | "business-facing" | "both";

export type ServiceProcessStep = {
  title: string;
  detail: string;
};

export type Service = {
  id: string;
  title: string;
  description: string;
  valueProposition: string;
  icon: ServiceIconName;
  engagement: ServiceEngagement;
  focus: ServiceFocus;
  domain: ServiceDomain;
  suitableFor: string;
  problems: readonly string[];
  capabilities: readonly string[];
  process: readonly ServiceProcessStep[];
  outcomes: readonly string[];
  relatedServiceIds: readonly string[];
};

export const SERVICES: readonly Service[] = [
  {
    id: "managed-it",
    title: "Managed IT",
    description:
      "Proactive monitoring, help desk support, and predictable monthly IT operations for growing teams.",
    valueProposition:
      "Replace ad-hoc vendor calls with a documented support model that catches issues early and keeps priorities visible.",
    icon: "Server",
    engagement: "ongoing",
    focus: "preventive",
    domain: "infrastructure",
    suitableFor:
      "Teams that need ongoing coverage, clear escalation paths, and monthly operational rhythm.",
    problems: [
      "Support depends on whoever is available that day",
      "Recurring issues are fixed repeatedly without root-cause tracking",
      "Leadership lacks a simple view of risk and open work",
      "Onboarding new devices and users is inconsistent",
    ],
    capabilities: [
      "Endpoint monitoring and patch coordination",
      "Help desk intake with priority triage",
      "Asset inventory and documentation baselines",
      "Backup oversight and recovery readiness reviews",
      "Monthly status summaries with recommended next steps",
    ],
    process: [
      {
        title: "Discover",
        detail:
          "Inventory systems, ownership, and pain points so support starts with shared context.",
      },
      {
        title: "Stabilize",
        detail:
          "Close urgent gaps in access, patching, and backup before expanding coverage.",
      },
      {
        title: "Operate",
        detail:
          "Run monitoring, ticket handling, and reporting on a predictable cadence.",
      },
      {
        title: "Improve",
        detail:
          "Review trends and phase improvements that reduce noise and strengthen resilience.",
      },
    ],
    outcomes: [
      "Fewer surprise outages from unmonitored systems",
      "Clearer ownership of recurring problems",
      "Documented standards new staff can follow",
      "A planning cadence instead of constant firefighting",
    ],
    relatedServiceIds: ["cybersecurity", "cloud-solutions", "computer-repair"],
  },
  {
    id: "computer-repair",
    title: "Computer Repair",
    description:
      "Fast diagnostics and repair for workstations, laptops, and peripherals—minimizing downtime.",
    valueProposition:
      "Restore productivity quickly with structured diagnostics, spare-device planning, and handoff notes your team can reuse.",
    icon: "Wrench",
    engagement: "project",
    focus: "reactive",
    domain: "infrastructure",
    suitableFor:
      "Offices dealing with aging hardware, intermittent failures, or disruptive one-off replacements.",
    problems: [
      "Broken devices sit idle while workarounds pile up",
      "Repairs happen without documenting root cause",
      "Replacement decisions are rushed and inconsistent",
      "Users lose time waiting for unclear status updates",
    ],
    capabilities: [
      "Workstation and laptop diagnostics",
      "Component replacement planning",
      "Imaging and baseline rebuilds",
      "Peripheral and dock troubleshooting",
      "Handoff documentation for future support",
    ],
    process: [
      {
        title: "Triage",
        detail: "Capture symptoms, impact, and urgency with the affected user or manager.",
      },
      {
        title: "Diagnose",
        detail: "Isolate hardware vs software causes and confirm spare-device options.",
      },
      {
        title: "Restore",
        detail: "Repair, rebuild, or replace using an agreed device standard where possible.",
      },
      {
        title: "Document",
        detail: "Record findings and prevention notes so the same issue is easier next time.",
      },
    ],
    outcomes: [
      "Shorter downtime for critical roles",
      "Fewer mystery failures returning after a quick fix",
      "Clearer device standards for future purchases",
      "Better continuity when staff change devices",
    ],
    relatedServiceIds: ["managed-it", "cloud-solutions"],
  },
  {
    id: "networking",
    title: "Networking",
    description:
      "Reliable wired and wireless infrastructure designed for performance, security, and scale.",
    valueProposition:
      "Build networks that support growth without becoming a tangle of guest access, dead zones, and undocumented changes.",
    icon: "Network",
    engagement: "hybrid",
    focus: "both",
    domain: "infrastructure",
    suitableFor:
      "Multi-site clinics, offices with hybrid staff, and teams outgrowing consumer-grade Wi-Fi.",
    problems: [
      "Coverage gaps disrupt meetings and clinical workflows",
      "Guest and staff traffic share the same risk surface",
      "Changes are made without diagrams or ownership notes",
      "Remote access and office access feel disconnected",
    ],
    capabilities: [
      "Wired and wireless site assessments",
      "Segmentation for staff, guests, and devices",
      "Secure remote-access design coordination",
      "Monitoring and alerting baselines",
      "Site standards for repeatable rollouts",
    ],
    process: [
      {
        title: "Assess",
        detail: "Map coverage, bottlenecks, and how people actually use the network.",
      },
      {
        title: "Design",
        detail: "Define segmentation, capacity, and a rollout sequence that limits disruption.",
      },
      {
        title: "Implement",
        detail: "Stage changes with validation checkpoints and rollback awareness.",
      },
      {
        title: "Operate",
        detail: "Hand off monitoring expectations and documentation for ongoing support.",
      },
    ],
    outcomes: [
      "More consistent connectivity across workspaces",
      "Clearer separation between guest and business traffic",
      "Documented standards for new locations",
      "Easier troubleshooting when issues appear",
    ],
    relatedServiceIds: ["cybersecurity", "managed-it", "cloud-solutions"],
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity",
    description:
      "Layered defenses, endpoint protection, and practical policies that reduce risk without friction.",
    valueProposition:
      "Strengthen identity, endpoints, and recovery readiness with priorities leadership can phase by risk and effort.",
    icon: "ShieldCheck",
    engagement: "hybrid",
    focus: "preventive",
    domain: "both",
    suitableFor:
      "Growing firms that need practical safeguards without claiming enterprise-grade compliance theater.",
    problems: [
      "MFA and access rules are uneven across tools",
      "Endpoints lack a consistent protection baseline",
      "Recovery plans exist only as tribal knowledge",
      "Staff are unsure how to report suspicious activity",
    ],
    capabilities: [
      "Identity and MFA policy design",
      "Endpoint protection baselines",
      "Email and phishing awareness framing",
      "Backup and recovery readiness reviews",
      "Prioritized remediation roadmaps",
    ],
    process: [
      {
        title: "Workshop",
        detail: "Identify critical systems, likely threats, and current control gaps.",
      },
      {
        title: "Baseline",
        detail: "Establish practical foundations for identity, endpoints, and recovery.",
      },
      {
        title: "Prioritize",
        detail: "Sequence work by business impact so improvements stay achievable.",
      },
      {
        title: "Reinforce",
        detail: "Document habits and reviews that keep controls from drifting over time.",
      },
    ],
    outcomes: [
      "Fewer high-risk access gaps",
      "A clearer shared language for security decisions",
      "Recovery steps that can be rehearsed",
      "A backlog leadership can fund in phases",
    ],
    relatedServiceIds: ["managed-it", "cloud-solutions", "networking"],
  },
  {
    id: "website-development",
    title: "Website Development",
    description:
      "Modern business websites that communicate trust, convert visitors, and stay easy to maintain.",
    valueProposition:
      "Give prospects a clear path from service interest to inquiry with accessible, maintainable site structure.",
    icon: "Code2",
    engagement: "project",
    focus: "both",
    domain: "business-facing",
    suitableFor:
      "Service businesses whose current site hides offerings, weakens trust, or stalls on mobile.",
    problems: [
      "Services are hard to understand in one pass",
      "Mobile visitors cannot find a clear next step",
      "Content updates feel brittle or vendor-locked",
      "The site does not reflect current capabilities",
    ],
    capabilities: [
      "Information architecture and content hierarchy",
      "Responsive UI for service discovery",
      "Accessibility and performance reviews",
      "Inquiry-path design for consultation requests",
      "Handoff documentation for content owners",
    ],
    process: [
      {
        title: "Clarify",
        detail: "Define audiences, offers, and the questions the site must answer first.",
      },
      {
        title: "Structure",
        detail: "Organize pages and CTAs so visitors can choose a path without guessing.",
      },
      {
        title: "Build",
        detail: "Implement a responsive experience with maintainable components and content zones.",
      },
      {
        title: "Launch",
        detail: "Validate accessibility, performance, and ownership of ongoing updates.",
      },
    ],
    outcomes: [
      "Clearer service messaging",
      "Stronger consultation paths on mobile and desktop",
      "Easier content maintenance after launch",
      "A site that supports—not confuses—sales conversations",
    ],
    relatedServiceIds: ["managed-it", "cloud-solutions"],
  },
  {
    id: "cloud-solutions",
    title: "Cloud Solutions",
    description:
      "Migration, Microsoft 365, and cloud architecture that keep collaboration secure and flexible.",
    valueProposition:
      "Move collaboration and identity into a cleaner cloud model with staged cutovers and stronger access controls.",
    icon: "Cloud",
    engagement: "hybrid",
    focus: "both",
    domain: "both",
    suitableFor:
      "Teams stuck between legacy mail/file tools and modern collaboration needs.",
    problems: [
      "Mail and files are scattered across aging systems",
      "Identity and device access are inconsistent",
      "Migrations feel risky because rollback is unclear",
      "Hybrid work exposes gaps in sharing and permissions",
    ],
    capabilities: [
      "Microsoft 365 discovery and migration planning",
      "Identity mapping and access hardening",
      "File collaboration structure",
      "Staged cutover and validation checklists",
      "Post-migration support handoff",
    ],
    process: [
      {
        title: "Discover",
        detail: "Inventory mailboxes, files, identities, and business constraints.",
      },
      {
        title: "Plan",
        detail: "Define waves, validation criteria, and communication for affected users.",
      },
      {
        title: "Migrate",
        detail: "Execute staged moves with checkpoints and known rollback options.",
      },
      {
        title: "Harden",
        detail: "Tighten access, document ownership, and settle into support routines.",
      },
    ],
    outcomes: [
      "Clearer collaboration patterns across hybrid teams",
      "Stronger identity and access hygiene",
      "Reduced dependency on brittle legacy systems",
      "A migration story leadership can follow",
    ],
    relatedServiceIds: ["managed-it", "cybersecurity", "website-development"],
  },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

export const SERVICE_COMPARISON = [
  {
    id: "engagement",
    label: "Engagement style",
    rows: [
      {
        title: "Ongoing coverage",
        detail: "Managed IT keeps monitoring, help desk, and reporting on a monthly rhythm.",
        serviceIds: ["managed-it"] as const,
      },
      {
        title: "Project-based delivery",
        detail: "Repair, website, and many migration efforts are scoped around a defined outcome.",
        serviceIds: ["computer-repair", "website-development"] as const,
      },
      {
        title: "Hybrid engagements",
        detail: "Networking, security, and cloud often start as projects and settle into operating guidance.",
        serviceIds: ["networking", "cybersecurity", "cloud-solutions"] as const,
      },
    ],
  },
  {
    id: "focus",
    label: "Preventive vs reactive",
    rows: [
      {
        title: "Preventive foundations",
        detail: "Managed IT and cybersecurity emphasize catching issues before they become outages.",
        serviceIds: ["managed-it", "cybersecurity"] as const,
      },
      {
        title: "Reactive restoration",
        detail: "Computer repair restores productivity when hardware or endpoints fail.",
        serviceIds: ["computer-repair"] as const,
      },
      {
        title: "Balanced programs",
        detail: "Networking and cloud combine design work with operational readiness.",
        serviceIds: ["networking", "cloud-solutions", "website-development"] as const,
      },
    ],
  },
  {
    id: "domain",
    label: "Infrastructure vs business-facing",
    rows: [
      {
        title: "Infrastructure-first",
        detail: "Managed IT, repair, and networking keep systems reachable and supportable.",
        serviceIds: ["managed-it", "computer-repair", "networking"] as const,
      },
      {
        title: "Business-facing",
        detail: "Website development focuses on how prospects understand and contact the business.",
        serviceIds: ["website-development"] as const,
      },
      {
        title: "Cross-cutting",
        detail: "Cybersecurity and cloud span both internal operations and customer-facing readiness.",
        serviceIds: ["cybersecurity", "cloud-solutions"] as const,
      },
    ],
  },
] as const;

export const OPERATING_PRINCIPLES = [
  {
    id: "discovery",
    title: "Start with discovery, not assumptions",
    detail:
      "Map systems, owners, and business constraints before recommending tools or retainers.",
  },
  {
    id: "communication",
    title: "Communicate in business language",
    detail:
      "Translate technical risk into decisions leaders can prioritize, fund, and schedule.",
  },
  {
    id: "documentation",
    title: "Document systems people can reuse",
    detail:
      "Keep diagrams, standards, and escalation paths current so support is not tribal knowledge.",
  },
  {
    id: "phasing",
    title: "Phase recommendations by impact",
    detail:
      "Stabilize urgent gaps first, then sequence improvements so change stays manageable.",
  },
  {
    id: "balance",
    title: "Balance reliability, security, and reality",
    detail:
      "Prefer practical controls that teams will actually follow over impressive but fragile setups.",
  },
] as const;

export const PROCESS_STEPS = [
  {
    step: "01",
    title: "Discover",
    detail: "Map systems, priorities, and risk so the engagement starts with clarity.",
  },
  {
    step: "02",
    title: "Stabilize",
    detail: "Close urgent gaps in backup, patching, and access before expanding scope.",
  },
  {
    step: "03",
    title: "Operate",
    detail: "Run monitoring, help desk, and reporting on a predictable monthly cadence.",
  },
  {
    step: "04",
    title: "Improve",
    detail: "Iterate on security, cloud, and productivity with documented roadmap reviews.",
  },
] as const;

export const TESTIMONIALS = [
  {
    id: "1",
    quote:
      "The proposed support model gave our team a clear path from reactive fixes to documented, predictable IT operations.",
    name: "Jordan Hale",
    role: "Illustrative operations leader",
  },
  {
    id: "2",
    quote:
      "The security roadmap balanced practical safeguards with the realities of a busy team and limited internal resources.",
    name: "Priya Raman",
    role: "Illustrative healthcare executive",
  },
  {
    id: "3",
    quote:
      "The engagement concept connected infrastructure and web priorities in one phased plan with clear decision points.",
    name: "Marcus Chen",
    role: "Illustrative retail founder",
  },
] as const;

export const FAQ_ITEMS = [
  {
    id: "msp",
    question: "What does a Managed IT partnership include?",
    answer:
      "In this demo model: monitoring, help desk, patch management, security baselines, backup oversight, and strategic guidance—scoped to the environment and priorities being discussed.",
  },
  {
    id: "response",
    question: "How are issues handled when something breaks?",
    answer:
      "Illustrative workflow: tickets are triaged by business impact during business hours. Critical outages are escalated first, with clear status updates while work is underway.",
  },
  {
    id: "remote",
    question: "Do you support remote and hybrid teams?",
    answer:
      "Yes. The demo model covers secure remote access, endpoint management, cloud collaboration tools, and consistent policies across office and remote staff.",
  },
  {
    id: "security",
    question: "Can you help with Cybersecurity foundations?",
    answer:
      "The concept focuses on practical controls, documentation, and awareness habits that support common SMB risk conversations—without claiming formal certification outcomes.",
  },
  {
    id: "websites",
    question: "Do you build and maintain business websites?",
    answer:
      "Website Development in this demo covers designing and maintaining modern sites with performance, accessibility, and clear calls to action suited for service businesses.",
  },
  {
    id: "onboarding",
    question: "What does onboarding look like?",
    answer:
      "The illustrative sequence starts with discovery, inventories systems, establishes baselines, then transitions support with documentation a team can actually use.",
  },
] as const;

export type PortfolioItem = {
  id: string;
  title: string;
  category: string;
  serviceId: ServiceId;
  summary: string;
  challenge: string;
  scope: string;
  outcome: string;
};

export const PORTFOLIO_ITEMS: readonly PortfolioItem[] = [
  {
    id: "clinic-network",
    title: "Multi-Site Clinic Network",
    category: "Networking",
    serviceId: "networking",
    summary:
      "A fictional modernization concept for a growing outpatient provider.",
    challenge:
      "Inconsistent wireless coverage and flat networks made support and access control difficult across four sites.",
    scope:
      "Segmented network architecture, secure staff and guest Wi-Fi, rollout sequencing, and centralized monitoring design.",
    outcome:
      "Illustrative result: a repeatable site standard with clearer ownership and safer traffic separation.",
  },
  {
    id: "retail-msp",
    title: "Retail MSP Rollout",
    category: "Managed IT",
    serviceId: "managed-it",
    summary:
      "An illustrative managed-services rollout for a 60-seat retail team.",
    challenge:
      "Store teams relied on inconsistent devices and informal support paths that obscured recurring issues.",
    scope:
      "Endpoint standards, intake workflows, escalation paths, asset inventory, and sample service reporting.",
    outcome:
      "Illustrative result: a support model designed for consistent onboarding and more visible operational trends.",
  },
  {
    id: "cloud-migration",
    title: "Microsoft 365 Migration",
    category: "Cloud Solutions",
    serviceId: "cloud-solutions",
    summary:
      "A fictional Microsoft 365 transition planned around business continuity.",
    challenge:
      "Legacy mail and scattered file storage limited collaboration while raising migration and access concerns.",
    scope:
      "Discovery, identity mapping, staged mailbox and file migration planning, validation, and security hardening.",
    outcome:
      "Illustrative result: a phased transition plan with rollback points, user guidance, and stronger access controls.",
  },
  {
    id: "security-baseline",
    title: "SMB Security Baseline",
    category: "Cybersecurity",
    serviceId: "cybersecurity",
    summary:
      "An illustrative security-foundation program for a professional-services firm.",
    challenge:
      "Rapid growth had outpaced consistent identity, endpoint, and employee-awareness practices.",
    scope:
      "Risk workshop, MFA policy, endpoint protection baseline, recovery review, and awareness campaign design.",
    outcome:
      "Illustrative result: a prioritized security backlog that leadership could phase by risk and effort.",
  },
  {
    id: "corporate-site",
    title: "Corporate Website Rebuild",
    category: "Website Development",
    serviceId: "website-development",
    summary:
      "A fictional accessible website refresh for a specialist consultancy.",
    challenge:
      "An outdated site made services difficult to understand and offered no clear inquiry path on mobile.",
    scope:
      "Content hierarchy, responsive UI, accessibility review, performance work, and consultation path design.",
    outcome:
      "Illustrative result: a clearer, faster experience ready for real content, integrations, and analytics.",
  },
  {
    id: "fleet-repair",
    title: "Workstation Refresh Program",
    category: "Computer Repair",
    serviceId: "computer-repair",
    summary:
      "An illustrative workstation lifecycle program for a field-services team.",
    challenge:
      "Aging hardware and one-off setups made replacements disruptive and support documentation unreliable.",
    scope:
      "Device standards, lifecycle tiers, image design, pilot planning, staged deployment, and handoff documentation.",
    outcome:
      "Illustrative result: a repeatable refresh playbook designed to reduce disruption and simplify support.",
  },
] as const;

export const ABOUT_STATS = [
  { label: "Systems and decisions", value: "Documented" },
  { label: "Security foundations", value: "Layered" },
  { label: "Communication style", value: "Clear" },
  { label: "Engagement planning", value: "Phased" },
] as const;

export const SITE = {
  name: "NovaTech Solutions",
  tagline: "Technology Solutions for Modern Businesses",
  description:
    "NovaTech Solutions is a fictional managed IT consultancy presented as a polished frontend demo for secure, productive business technology.",
  phone: "(555) 014-2200",
  email: "hello@novatech.example",
  address: "480 Innovation Drive, Suite 200, Austin, TX 78701",
  hours: "Mon–Fri 8:00 AM – 6:00 PM",
  copyright: `© ${new Date().getFullYear()} NovaTech Solutions. All rights reserved.`,
} as const;

export const DEMO_BASE = "/demos/novatech-solutions";

export const NAV_LINKS = [
  { href: DEMO_BASE, label: "Home" },
  { href: `${DEMO_BASE}/about`, label: "About" },
  { href: `${DEMO_BASE}/services`, label: "Services" },
  { href: `${DEMO_BASE}/portfolio`, label: "Portfolio" },
  { href: `${DEMO_BASE}/faq`, label: "FAQ" },
  { href: `${DEMO_BASE}/contact`, label: "Contact" },
] as const;

export const SERVICES = [
  {
    id: "managed-it",
    title: "Managed IT",
    description:
      "Proactive monitoring, help desk support, and predictable monthly IT operations for growing teams.",
    icon: "Server" as const,
  },
  {
    id: "computer-repair",
    title: "Computer Repair",
    description:
      "Fast diagnostics and repair for workstations, laptops, and peripherals—minimizing downtime.",
    icon: "Wrench" as const,
  },
  {
    id: "networking",
    title: "Networking",
    description:
      "Reliable wired and wireless infrastructure designed for performance, security, and scale.",
    icon: "Network" as const,
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity",
    description:
      "Layered defenses, endpoint protection, and practical policies that reduce risk without friction.",
    icon: "ShieldCheck" as const,
  },
  {
    id: "website-development",
    title: "Website Development",
    description:
      "Modern business websites that communicate trust, convert visitors, and stay easy to maintain.",
    icon: "Code2" as const,
  },
  {
    id: "cloud-solutions",
    title: "Cloud Solutions",
    description:
      "Migration, Microsoft 365, and cloud architecture that keep collaboration secure and flexible.",
    icon: "Cloud" as const,
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
    question: "What does a managed IT partnership include?",
    answer:
      "Typically monitoring, help desk, patch management, security baselines, backup oversight, and strategic guidance—scoped to your environment and budget.",
  },
  {
    id: "response",
    question: "How quickly do you respond to issues?",
    answer:
      "Priority tickets are triaged immediately during business hours. Critical outages are escalated with clear SLAs defined in your service agreement.",
  },
  {
    id: "remote",
    question: "Do you support remote and hybrid teams?",
    answer:
      "Yes. We support secure remote access, endpoint management, cloud collaboration tools, and consistent policies across office and remote staff.",
  },
  {
    id: "security",
    question: "Can you help with cybersecurity compliance?",
    answer:
      "We implement foundational controls, employee awareness practices, and documentation that support common compliance frameworks for SMBs.",
  },
  {
    id: "websites",
    question: "Do you build and maintain business websites?",
    answer:
      "We design, develop, and maintain modern sites with performance, accessibility, and clear calls to action suited for service businesses.",
  },
  {
    id: "onboarding",
    question: "What does onboarding look like?",
    answer:
      "We start with discovery, inventory your systems, establish baselines, then transition support with documentation your team can actually use.",
  },
] as const;

export const PORTFOLIO_ITEMS = [
  {
    id: "clinic-network",
    title: "Multi-Site Clinic Network",
    category: "Networking",
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
    summary:
      "A fictional accessible website refresh for a specialist consultancy.",
    challenge:
      "An outdated site made services difficult to understand and offered no clear inquiry path on mobile.",
    scope:
      "Content hierarchy, responsive UI, accessibility review, performance work, and demo inquiry flow.",
    outcome:
      "Illustrative result: a clearer, faster experience ready for real content, integrations, and analytics.",
  },
  {
    id: "fleet-repair",
    title: "Workstation Refresh Program",
    category: "Computer Repair",
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

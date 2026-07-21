import type { Project } from "@/lib/projectData";
import { getProjectById, projects } from "@/lib/projectData";

export type ChartPoint = { label: string; value: number };

export type CaseStudyChart = {
  id: string;
  title: string;
  description: string;
  type: "line" | "bar" | "area";
  unit?: string;
  series: ChartPoint[];
};

export type CaseStudy = {
  projectId: string;
  overview: string;
  problem: string;
  approach: string;
  outcome: string;
  decisions?: { title: string; explanation: string }[];
  nextSteps?: string[];
  highlights: string[];
  metrics: { label: string; value: string; detail: string }[];
  charts: CaseStudyChart[];
};

const studies: Record<string, Omit<CaseStudy, "projectId">> = {
  "event-horizon": {
    overview:
      "I built Event Horizon as a production-style event discovery frontend using Next.js, TypeScript, Tailwind CSS, and Framer Motion. I wanted event discovery to feel calmer and more intentional, so users can search a typed catalog, narrow it with useful filters, browse featured experiences, open shareable event pages, and save favorites without being forced to create an account. The dark editorial interface, responsive layouts, and restrained motion all support the same idea: the events should be the exciting part, not the interface surrounding them.",
    problem:
      "When I looked at typical event platforms, I kept running into the same problem: too many listings, promotions, and controls were competing for attention. I wanted to give users enough information to make a confident choice without making them fight the interface. That meant finding a balance between useful density and a discovery flow that still felt fast, readable, and calm on both mobile and desktop.",
    approach:
      "I used the Next.js App Router to separate the system by responsibility rather than making everything client-rendered. Event content, metadata, and detail routes are statically generated for fast delivery and search visibility, while focused client components own search, filters, favorites, galleries, and motion. TypeScript gives every view the same event contract. I deliberately started with a typed local catalog and browser-persistent favorites so I could prove the entire discovery journey before taking on API reliability, authentication, payments, and live inventory.",
    outcome:
      "I ended up with a polished frontend prototype that shows how I think about products, component architecture, performance-minded rendering, and accessibility. I am also careful not to oversell it as a finished ticket marketplace. The next production step would be replacing mock data with a validated API, adding authenticated cross-device favorites, moving large-catalog search to the server, serializing every filter into the URL, and backing the experience with automated tests and real performance monitoring.",
    decisions: [
      {
        title: "Next.js for a hybrid rendering model",
        explanation:
          "I wanted event pages to benefit from static generation, metadata, and shareable routes, but the discovery controls still needed client-side state. Next.js gave me both without forcing the entire application into a single rendering strategy.",
      },
      {
        title: "TypeScript for a shared event contract",
        explanation:
          "Cards, filters, favorites, carousels, and detail pages all consume the same event shape. I used a typed model to keep those features honest and consistent, and to make a future API migration much safer.",
      },
      {
        title: "Static data before backend complexity",
        explanation:
          "I chose a deterministic local catalog because I wanted to prove the information architecture and interaction flow first. The tradeoff is straightforward: the current linear search and client-side catalog make sense for a prototype, but not for a large live inventory.",
      },
      {
        title: "Local-first favorites",
        explanation:
          "I used local storage to give people immediate persistence without putting an account wall in front of a simple save action. I describe it as local-first—not server-optimistic—because there is no remote mutation, rollback, or cross-device synchronization yet.",
      },
      {
        title: "Editorial restraint over marketplace noise",
        explanation:
          "I kept the surrounding UI deliberately restrained. Dark neutral surfaces, generous spacing, strong hierarchy, and controlled motion let the event imagery carry the emotion while the information stays easy to scan.",
      },
      {
        title: "Accessibility as architecture",
        explanation:
          "I treated accessibility as part of the interaction architecture rather than a cleanup pass. Semantic structure, visible focus, labeled controls, live feedback, and reduced-motion support are already present, while focus trapping and carousel keyboard behavior remain clear follow-up work.",
      },
    ],
    nextSteps: [
      "Connect a real event API and database with runtime schema validation",
      "Add authentication and synchronized favorites with optimistic updates and rollback",
      "Serialize category, city, date, and sort state into shareable URLs",
      "Move large-catalog search to an indexed server-side service with pagination",
      "Complete modal and mobile-navigation focus management",
      "Add unit, integration, and end-to-end tests",
      "Measure real Web Vitals and product analytics in a deployed environment",
    ],
    highlights: [
      "Text search with query-string synchronization",
      "Category, city, date, and sorting controls",
      "Featured carousel with restrained motion",
      "Statically generated event pages with metadata",
      "Browser-persistent local favorites",
    ],
    metrics: [
      { label: "Event routes", value: "9", detail: "Statically generated from typed mock data" },
      { label: "Filter dimensions", value: "4", detail: "Text, category, city, and minimum date" },
      { label: "Core views", value: "5", detail: "Home, browse, detail, favorites, and about" },
    ],
    charts: [
      {
        id: "eh-engagement",
        title: "Proposed discovery-engagement measurement",
        description:
          "Illustrative data showing how I would track sessions completing the search → detail → save loop after launch; this is not production analytics.",
        type: "area",
        unit: "sessions",
        series: [
          { label: "W1", value: 820 },
          { label: "W2", value: 940 },
          { label: "W3", value: 1120 },
          { label: "W4", value: 1280 },
          { label: "W5", value: 1510 },
          { label: "W6", value: 1740 },
          { label: "W7", value: 1890 },
          { label: "W8", value: 2100 },
        ],
      },
      {
        id: "eh-filters",
        title: "Proposed filter-usage measurement",
        description:
          "Illustrative data showing the kind of filter adoption I would measure after instrumentation; these values are not from real users.",
        type: "bar",
        unit: "%",
        series: [
          { label: "Search", value: 38 },
          { label: "Date", value: 26 },
          { label: "City", value: 21 },
          { label: "Category", value: 15 },
        ],
      },
    ],
  },
  "novatech-solutions": {
    overview:
      "I built NovaTech Solutions as a production-style marketing frontend for a fictional managed IT services provider using Next.js, TypeScript, Tailwind CSS, and Framer Motion. I wanted to explore how a technical business could explain complex services without making nontechnical buyers feel lost. Across six responsive routes, the site uses clear navigation, a structured service taxonomy, illustrative trust signals, FAQs, portfolio summaries, and repeated contact paths to tell a credible business story.",
    problem:
      "Managed service providers often sound very similar on paper, which makes it hard for a buyer to understand what is actually different or who they can trust with critical systems. My challenge was to make technical services easy to scan, answer common objections without burying people in copy, and create a visual tone that felt dependable enough for security, infrastructure, and long-term support.",
    approach:
      "I organized the experience around six shareable App Router pages: home, about, services, portfolio, FAQ, and contact. I centralized the company content in typed constants so service descriptions, testimonials, statistics, and contact details would stay consistent wherever they appeared. Shared components handle navigation, section headers, calls to action, accordions, and restrained reveal motion. Starting with static content let me validate the communication hierarchy before committing to a CMS, CRM, analytics stack, or lead-delivery backend.",
    outcome:
      "The result is a cohesive frontend prototype that shows how I approach corporate information architecture, reusable components, responsive behavior, and accessibility foundations. I am intentionally transparent about its scope: NovaTech is fictional, the testimonials and business figures are illustrative, and the contact form currently confirms the interaction without sending data. Turning it into a real MSP website would start with verified content and a secure lead pipeline—not simply publishing the prototype as-is.",
    decisions: [
      {
        title: "App Router for clear business routes",
        explanation:
          "I gave each major buyer concern its own shareable page with route-level metadata. That keeps the journey understandable, supports search visibility, and lets mostly static business content remain simple to render.",
      },
      {
        title: "Centralized typed content",
        explanation:
          "I kept services, FAQs, testimonials, company details, and portfolio summaries in one TypeScript source. It prevents repeated content from drifting and makes the prototype easy to customize, although a real marketing team would probably need a validated CMS.",
      },
      {
        title: "Reusable presentation system",
        explanation:
          "I built shared buttons, headers, accordions, calls to action, and layout components so six routes would still feel like one product. Some simple components currently hydrate for animation, and I would move those back toward server rendering where the interaction does not justify the JavaScript.",
      },
      {
        title: "FAQ as structured objection handling",
        explanation:
          "I used an accessible accordion because buyers usually arrive with specific concerns, not a desire to read every answer. It keeps the page scannable, but I would treat its effect on conversion or bounce rate as a hypothesis until real analytics prove it.",
      },
      {
        title: "Restrained corporate visual language",
        explanation:
          "I chose dark blue, teal, low-contrast borders, controlled gradients, and limited elevation to communicate stability without making an infrastructure company feel cold, generic, or dated.",
      },
      {
        title: "Prototype the journey before the lead stack",
        explanation:
          "I wanted to validate the services → proof → FAQ → contact journey before wiring a CRM, email provider, spam controls, and data governance. Those are not optional production details, but they would have distracted from testing the core communication flow too early.",
      },
    ],
    nextSteps: [
      "Replace fictional identity, statistics, testimonials, and engagements with verified content",
      "Add server-side form validation, pending/error states, and secure CRM or email delivery",
      "Implement rate limiting, bot protection, consent, logging, and privacy disclosure",
      "Complete mobile-menu focus trapping, restoration, and background inertness",
      "Add individual service and verified client case-study pages",
      "Add sitemap, canonical URLs, Open Graph assets, and structured organization data",
      "Measure real Web Vitals and conversion events after deployment",
      "Add component, integration, end-to-end, and accessibility tests",
    ],
    highlights: [
      "Six routed marketing pages with metadata",
      "Six-service taxonomy driven by typed content",
      "Accessible FAQ accordion with structured relationships",
      "Responsive contact-form interface with local status feedback",
    ],
    metrics: [
      { label: "Routes", value: "6", detail: "Home, about, services, portfolio, FAQ, and contact" },
      { label: "Service areas", value: "6", detail: "Managed IT through consulting capabilities" },
      { label: "FAQ entries", value: "6", detail: "Structured objection-handling content" },
    ],
    charts: [
      {
        id: "nt-leads",
        title: "Proposed qualified-lead measurement",
        description:
          "Illustrative data showing how monthly sales-ready submissions could be tracked after a real CRM and analytics pipeline are installed; this is not production data.",
        type: "line",
        unit: "leads",
        series: [
          { label: "Jan", value: 12 },
          { label: "Feb", value: 15 },
          { label: "Mar", value: 18 },
          { label: "Apr", value: 22 },
          { label: "May", value: 27 },
          { label: "Jun", value: 31 },
        ],
      },
      {
        id: "nt-services",
        title: "Proposed service-interest measurement",
        description:
          "Illustrative pageview distribution showing the service-content demand I would measure after launch; these values are not from real visitors.",
        type: "bar",
        unit: "views",
        series: [
          { label: "Managed IT", value: 420 },
          { label: "Security", value: 360 },
          { label: "Cloud", value: 310 },
          { label: "Support", value: 280 },
          { label: "Consulting", value: 190 },
        ],
      },
    ],
  },
  taskflow: {
    overview:
      "I built TaskFlow as a production-style project-management frontend inspired by tools like Linear, Notion, and ClickUp. Using Next.js, TypeScript, Tailwind CSS, and Framer Motion, I wanted to see how much operational detail I could surface without making the product feel noisy. Across six responsive views—dashboard, projects, tasks, calendar, team, and settings—the shared typed fixture model supports project filtering, native kanban movement, deadline visualization, command search, team presence cues, and preference controls.",
    problem:
      "Project-management tools have to show a lot at once: status, ownership, priority, deadlines, and team activity all matter. The problem is that giving every piece of information equal visual weight quickly becomes exhausting. My challenge was to preserve the density that real work requires while still giving users a clear hierarchy, predictable navigation, and an interaction language that stays out of the way.",
    approach:
      "I started with a shared application shell so route-aware navigation, responsive sidebar behavior, page titles, transitions, and command search would feel consistent everywhere. A centralized TypeScript fixture module defines projects, tasks, team members, and activity records, which gives each screen the same domain language. From there, individual client views own the state they need: projects can be searched and sorted, tasks can move between five status columns, the calendar can navigate months, and settings demonstrate where persistent preferences would live.",
    outcome:
      "The result is a visually cohesive frontend prototype that lets me validate the product hierarchy and core interaction patterns before building the collaboration backend. I am clear about what is still missing: kanban changes and settings are temporary, dashboard summaries come from fixture data, and there is no authentication, database, real-time synchronization, or durable persistence yet. My next iteration would start with a normalized data model and accessible mutation workflows before layering on production analytics.",
    decisions: [
      {
        title: "Typed fixture model before a database",
        explanation:
          "I used shared Project, Task, TeamMember, and Activity types so I could validate relationships across six screens quickly. The tradeoff is that duplicated fixture counts can drift and local updates do not propagate across routes, which is exactly why a normalized backend is the next architectural step.",
      },
      {
        title: "Shared workspace shell",
        explanation:
          "I wanted navigation, responsive behavior, command access, route titles, and transitions to feel predictable regardless of the active workspace view. One shared shell provides that consistency, while read-heavy screens could later move toward server rendering with smaller client islands.",
      },
      {
        title: "Native drag and drop for prototype speed",
        explanation:
          "I used native HTML drag and drop to prove the status-change interaction without bringing in a large dependency too early. It does the job for a desktop prototype, but I would not call it production-grade because movement is temporary and there is no equivalent keyboard or dependable touch workflow.",
      },
      {
        title: "Custom UI primitives",
        explanation:
          "I built reusable buttons, modals, dropdowns, progress bars, tooltips, and empty states because a product this dense needs a consistent UI vocabulary. The tradeoff is ownership: complex primitives also make me responsible for complete focus management and keyboard behavior before production.",
      },
      {
        title: "Compact visual density",
        explanation:
          "I used neutral surfaces, restrained blue accents, compact typography, and horizontal board scrolling to keep operational data visible without making every element demand attention at once.",
      },
      {
        title: "Route-based product areas",
        explanation:
          "I gave dashboard, projects, tasks, calendar, team, and settings stable URLs and focused responsibilities. It makes the application easier to understand today and creates a clean path toward deep links for individual projects and tasks later.",
      },
    ],
    nextSteps: [
      "Create normalized workspace, user, project, task, status, label, and activity models",
      "Add authentication, workspace isolation, and role-based authorization",
      "Replace fixtures with validated server APIs and derive counts instead of duplicating them",
      "Add persistent task/project CRUD with optimistic updates and conflict handling",
      "Replace placeholder drag and drop with accessible keyboard and touch interactions",
      "Persist settings and make density and week-start controls affect the interface",
      "Define and instrument real dashboard metrics before presenting analytics",
      "Add unit, integration, end-to-end, and automated accessibility tests",
    ],
    highlights: [
      "Six routed workspace views in a shared responsive shell",
      "Searchable and sortable project catalog",
      "Five-column kanban with local task movement",
      "Calendar, team, command search, and settings interfaces",
    ],
    metrics: [
      { label: "Views", value: "6", detail: "Dashboard through settings routes" },
      { label: "Task statuses", value: "5", detail: "Backlog, todo, in progress, review, and done" },
      { label: "Fixture tasks", value: "12", detail: "Typed records shared across product views" },
    ],
    charts: [
      {
        id: "tf-velocity",
        title: "Proposed delivery-trend measurement",
        description:
          "Illustrative data showing the type of sprint trend I would measure after adding sprint and story-point models; this is not generated by the current prototype.",
        type: "area",
        unit: "pts",
        series: [
          { label: "S1", value: 34 },
          { label: "S2", value: 41 },
          { label: "S3", value: 38 },
          { label: "S4", value: 47 },
          { label: "S5", value: 52 },
          { label: "S6", value: 49 },
          { label: "S7", value: 56 },
        ],
      },
      {
        id: "tf-status",
        title: "Current fixture tasks by status",
        description:
          "A factual snapshot of the 12 typed task records currently represented by the prototype board.",
        type: "bar",
        unit: "tasks",
        series: [
          { label: "Backlog", value: 3 },
          { label: "Todo", value: 3 },
          { label: "In progress", value: 3 },
          { label: "Review", value: 2 },
          { label: "Done", value: 1 },
        ],
      },
    ],
  },
  "signal-board": {
    overview:
      "Signal Board is a collaborative incident status surface with live presence cues and structured postmortem capture.",
    problem:
      "During incidents, chat scrolls away and status is tribal knowledge. Teams needed a single pane for severity, owners, and timeline.",
    approach:
      "Designed around presence + severity lanes, with postmortem templates that force root-cause discipline after the fire is out.",
    outcome:
      "A systems-minded web concept that bridges realtime UX and operational documentation.",
    highlights: [
      "Severity lanes with owner assignment",
      "Presence indicators for responders",
      "Postmortem template workflow",
      "Timeline of status changes",
    ],
    metrics: [
      { label: "MTTA", value: "-28%", detail: "Simulated triage with shared board" },
      { label: "Postmortems", value: "100%", detail: "Incidents closed with template" },
      { label: "Channels", value: "1", detail: "Replaces scattered status threads" },
    ],
    charts: [
      {
        id: "sb-mtta",
        title: "Mean time to acknowledge",
        description: "Minutes from open to first owner ack.",
        type: "line",
        unit: "min",
        series: [
          { label: "Mon", value: 18 },
          { label: "Tue", value: 14 },
          { label: "Wed", value: 12 },
          { label: "Thu", value: 11 },
          { label: "Fri", value: 9 },
          { label: "Sat", value: 10 },
          { label: "Sun", value: 8 },
        ],
      },
      {
        id: "sb-sev",
        title: "Incidents by severity",
        description: "Volume over a sample quarter.",
        type: "bar",
        unit: "count",
        series: [
          { label: "SEV-1", value: 4 },
          { label: "SEV-2", value: 11 },
          { label: "SEV-3", value: 27 },
          { label: "SEV-4", value: 41 },
        ],
      },
    ],
  },
  "northline-identity": {
    overview:
      "Northline Identity is a brand system for a logistics startup—wordmark, color logic, and modular collateral that scales from truck livery to invoices.",
    problem:
      "Early-stage logistics brands often look generic. Northline needed a mark that felt precise, durable, and easy to apply across media.",
    approach:
      "Built a modular wordmark with a directional motif, a restrained palette, and templates for stationery, signage, and digital headers.",
    outcome:
      "A cohesive identity kit that demonstrates systems thinking in graphic design—not just a logo drop.",
    highlights: [
      "Wordmark + monogram lockups",
      "Color logic for print and fleet",
      "Collateral templates",
      "Usage rules for partners",
    ],
    metrics: [
      { label: "Lockups", value: "8", detail: "Primary, stacked, mono, badge" },
      { label: "Palette", value: "5", detail: "Core + neutrals + signal accent" },
      { label: "Templates", value: "12", detail: "Print and digital applications" },
    ],
    charts: [
      {
        id: "nl-apps",
        title: "Brand applications shipped",
        description: "Assets completed by category.",
        type: "bar",
        unit: "assets",
        series: [
          { label: "Print", value: 14 },
          { label: "Digital", value: 22 },
          { label: "Fleet", value: 6 },
          { label: "Signage", value: 5 },
          { label: "Social", value: 18 },
        ],
      },
      {
        id: "nl-review",
        title: "Stakeholder review rounds",
        description: "Iteration depth before freeze.",
        type: "line",
        unit: "rounds",
        series: [
          { label: "Brief", value: 1 },
          { label: "Explore", value: 3 },
          { label: "Refine", value: 2 },
          { label: "System", value: 2 },
          { label: "Freeze", value: 1 },
        ],
      },
    ],
  },
  "pulse-poster-series": {
    overview:
      "Pulse Poster Series is a limited-run set exploring rhythm, typography, and restrained neon for a music festival.",
    problem:
      "Festival posters often shout. Pulse needed energy without visual exhaustion—type and rhythm doing the heavy lifting.",
    approach:
      "Designed a modular grid and neon accent language that repeats across sizes while each piece stays distinct.",
    outcome:
      "A cohesive series that reads as premium print craft in a portfolio context.",
    highlights: [
      "Shared modular grid",
      "Typography-led compositions",
      "Restrained neon accents",
      "Print-ready color separations",
    ],
    metrics: [
      { label: "Posters", value: "6", detail: "Unique compositions, shared system" },
      { label: "Sizes", value: "3", detail: "A2, A3, social crop" },
      { label: "Ink set", value: "CMYK+N", detail: "Spot neon on key runs" },
    ],
    charts: [
      {
        id: "pp-edition",
        title: "Edition sell-through",
        description: "Percent of print run claimed by week.",
        type: "area",
        unit: "%",
        series: [
          { label: "W1", value: 18 },
          { label: "W2", value: 34 },
          { label: "W3", value: 51 },
          { label: "W4", value: 67 },
          { label: "W5", value: 82 },
          { label: "W6", value: 94 },
        ],
      },
      {
        id: "pp-format",
        title: "Preferred formats",
        description: "Audience picks during soft launch.",
        type: "bar",
        unit: "%",
        series: [
          { label: "A2", value: 41 },
          { label: "A3", value: 33 },
          { label: "Social", value: 26 },
        ],
      },
    ],
  },
  "orbit-ui-kit": {
    overview:
      "Orbit UI Kit covers component library visuals and documentation art direction for a developer tooling platform.",
    problem:
      "Docs that look unfinished erode trust in the product. Orbit needed visual rigor matching the engineering bar.",
    approach:
      "Established illustration rules, token-aligned color, and documentation layouts that showcase components in realistic density.",
    outcome:
      "A design system presentation layer that feels shippable alongside real code.",
    highlights: [
      "Component showcase layouts",
      "Token-aligned color art",
      "Docs cover system",
      "Empty/error state illustrations",
    ],
    metrics: [
      { label: "Components", value: "40+", detail: "Documented visual treatments" },
      { label: "Tokens", value: "Synced", detail: "Mapped to product CSS variables" },
      { label: "States", value: "12", detail: "Empty, loading, error patterns" },
    ],
    charts: [
      {
        id: "or-adoption",
        title: "Component adoption",
        description: "Screens using kit primitives over time.",
        type: "line",
        unit: "%",
        series: [
          { label: "M1", value: 22 },
          { label: "M2", value: 35 },
          { label: "M3", value: 48 },
          { label: "M4", value: 61 },
          { label: "M5", value: 74 },
          { label: "M6", value: 83 },
        ],
      },
      {
        id: "or-cats",
        title: "Kit coverage by category",
        description: "Documented components per group.",
        type: "bar",
        unit: "count",
        series: [
          { label: "Inputs", value: 11 },
          { label: "Nav", value: 7 },
          { label: "Feedback", value: 9 },
          { label: "Data", value: 8 },
          { label: "Overlay", value: 6 },
        ],
      },
    ],
  },
  "edge-lab-network": {
    overview:
      "Edge Lab Network is a segmented lab with monitored switches, documented VLANs, and repeatable restore procedures.",
    problem:
      "Student and R&D labs break quietly. Without segmentation and restore docs, recovery becomes guesswork.",
    approach:
      "Designed VLAN boundaries, monitoring hooks, and a restore runbook that a second engineer can execute cold.",
    outcome:
      "An IT case study that shows operational maturity—diagrams, metrics, and procedures over buzzwords.",
    highlights: [
      "VLAN segmentation plan",
      "Switch monitoring baseline",
      "Restore runbook",
      "Change window checklist",
    ],
    metrics: [
      { label: "VLANs", value: "6", detail: "User, lab, Mgmt, IoT, Guest, Voice" },
      { label: "Restore drill", value: "22m", detail: "Cold restore from documented steps" },
      { label: "Uptime", value: "99.4%", detail: "Lab window over sample term" },
    ],
    charts: [
      {
        id: "el-traffic",
        title: "Inter-VLAN traffic",
        description: "Relative throughput by segment pair.",
        type: "bar",
        unit: "Gb",
        series: [
          { label: "User↔Lab", value: 42 },
          { label: "Lab↔Mgmt", value: 18 },
          { label: "IoT↔Mgmt", value: 9 },
          { label: "Guest", value: 14 },
          { label: "Voice", value: 6 },
        ],
      },
      {
        id: "el-alerts",
        title: "Monitoring alerts / week",
        description: "Noise reduced after baseline tuning.",
        type: "line",
        unit: "alerts",
        series: [
          { label: "W1", value: 38 },
          { label: "W2", value: 29 },
          { label: "W3", value: 21 },
          { label: "W4", value: 16 },
          { label: "W5", value: 12 },
          { label: "W6", value: 9 },
        ],
      },
    ],
  },
  "fleet-image-pipeline": {
    overview:
      "Fleet Image Pipeline automates Windows imaging so workstation setup drops from hours to under twenty minutes.",
    problem:
      "Manual imaging burns technician time and creates configuration drift across the fleet.",
    approach:
      "MDT task sequences, driver injection, and PowerShell post-config to standardize apps, policies, and naming.",
    outcome:
      "A measurable IT efficiency win with graphs that show cycle-time collapse and consistency gains.",
    highlights: [
      "MDT task sequence design",
      "Driver injection strategy",
      "PowerShell post-config",
      "Gold image versioning",
    ],
    metrics: [
      { label: "Setup time", value: "18m", detail: "Median from bare metal to ready" },
      { label: "Drift tickets", value: "-64%", detail: "Config variance after rollout" },
      { label: "Tech hours", value: "-120h", detail: "Saved per 100 machines" },
    ],
    charts: [
      {
        id: "fi-time",
        title: "Imaging cycle time",
        description: "Minutes per machine before vs after pipeline.",
        type: "line",
        unit: "min",
        series: [
          { label: "Manual", value: 145 },
          { label: "v1", value: 78 },
          { label: "v2", value: 41 },
          { label: "v3", value: 26 },
          { label: "v4", value: 18 },
        ],
      },
      {
        id: "fi-volume",
        title: "Machines imaged / month",
        description: "Throughput after automation.",
        type: "area",
        unit: "PCs",
        series: [
          { label: "Jan", value: 22 },
          { label: "Feb", value: 31 },
          { label: "Mar", value: 44 },
          { label: "Apr", value: 52 },
          { label: "May", value: 61 },
          { label: "Jun", value: 70 },
        ],
      },
    ],
  },
  "bench-diagnostics": {
    overview:
      "Bench Diagnostics Suite standardizes hardware triage checklists for no-POST and storage failures.",
    problem:
      "Bench work is tribal. Without shared checklists, junior techs escalate late and repeat dead ends.",
    approach:
      "Codified decision trees, tooling notes, and pass/fail gates for common failure classes.",
    outcome:
      "Faster triage with fewer bounce-backs—documented as an IT craft portfolio piece.",
    highlights: [
      "No-POST decision tree",
      "Storage failure checklist",
      "Tooling notes board",
      "Escalation criteria",
    ],
    metrics: [
      { label: "Triage time", value: "-35%", detail: "Median bench diagnosis duration" },
      { label: "First-pass", value: "81%", detail: "Fixes without re-open" },
      { label: "Checklists", value: "9", detail: "Covered failure classes" },
    ],
    charts: [
      {
        id: "bd-triage",
        title: "Median triage minutes",
        description: "Before and after checklist adoption.",
        type: "bar",
        unit: "min",
        series: [
          { label: "No-POST", value: 52 },
          { label: "Storage", value: 41 },
          { label: "GPU", value: 33 },
          { label: "Power", value: 28 },
          { label: "Thermal", value: 24 },
        ],
      },
      {
        id: "bd-resolve",
        title: "Resolution rate",
        description: "First-pass success by week after rollout.",
        type: "area",
        unit: "%",
        series: [
          { label: "W1", value: 62 },
          { label: "W2", value: 68 },
          { label: "W3", value: 73 },
          { label: "W4", value: 77 },
          { label: "W5", value: 81 },
          { label: "W6", value: 84 },
        ],
      },
    ],
  },
};

export function getCaseStudy(projectId: string): (CaseStudy & { project: Project }) | null {
  const project = getProjectById(projectId);
  const study = studies[projectId];
  if (!project || !study) return null;
  return { projectId, project, ...study };
}

export function getAllCaseStudyIds(): string[] {
  return projects.filter((project) => Boolean(studies[project.id])).map((project) => project.id);
}

/** Illustrative business metrics for the NovaTech homepage insights panel. */

export const BUSINESS_INSIGHTS = [
  {
    label: "Uptime",
    value: 99.8,
    decimals: 1,
    suffix: "%",
    prefix: "",
    delta: "+0.3 pts vs last quarter",
  },
  {
    label: "Tickets closed",
    value: 1284,
    decimals: 0,
    suffix: "",
    prefix: "",
    delta: "+18% month over month",
  },
  {
    label: "Avg. resolution",
    value: 2.4,
    decimals: 1,
    suffix: "h",
    prefix: "",
    delta: "−22 min faster",
  },
  {
    label: "Active clients",
    value: 86,
    decimals: 0,
    suffix: "",
    prefix: "",
    delta: "+7 net new this quarter",
  },
] as const;

export const GROWTH_SERIES = [
  { label: "W1", value: 42 },
  { label: "W2", value: 48 },
  { label: "W3", value: 51 },
  { label: "W4", value: 57 },
  { label: "W5", value: 61 },
  { label: "W6", value: 66 },
  { label: "W7", value: 70 },
  { label: "W8", value: 78 },
] as const;

export const PIPELINE_STAGES = [
  { label: "New inquiries", count: 64, percent: 100 },
  { label: "Qualified", count: 42, percent: 66 },
  { label: "Discovery booked", count: 28, percent: 44 },
  { label: "Proposal sent", count: 16, percent: 25 },
  { label: "Won", count: 9, percent: 14 },
] as const;

export const RECENT_ACTIVITY = [
  {
    id: "a1",
    title: "Backup verification completed",
    detail: "Northside Clinic · all critical volumes passed restore test",
    when: "2 hours ago",
  },
  {
    id: "a2",
    title: "Security baseline updated",
    detail: "MFA rollout finished for Harbor Dental staff accounts",
    when: "Yesterday",
  },
  {
    id: "a3",
    title: "Monthly status delivered",
    detail: "Executive summary shared with Ridge Logistics leadership",
    when: "2 days ago",
  },
  {
    id: "a4",
    title: "New consultation request",
    detail: "Inbound from professional services firm · HubSpot synced",
    when: "3 days ago",
  },
] as const;

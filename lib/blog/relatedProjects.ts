/**
 * Maps blog `project` frontmatter to a portfolio route.
 * StarLenz does not yet have a full case study — the related link goes to
 * a dedicated in-development placeholder until that page exists.
 */
export type RelatedProjectLink = {
  label: string;
  href: string;
  inDevelopment?: boolean;
};

const RELATED_PROJECTS: Record<string, RelatedProjectLink> = {
  starlenz: {
    label: "StarLenz",
    href: "/projects/starlenz",
    inDevelopment: true,
  },
  "event-horizon": {
    label: "Event Horizon",
    href: "/projects/event-horizon",
  },
};

export function getRelatedProject(project?: string): RelatedProjectLink | null {
  if (!project) return null;
  const key = project.trim().toLowerCase().replace(/\s+/g, "-");
  return RELATED_PROJECTS[key] ?? null;
}

/**
 * Browse categories for the blog index. Implementation tags stay on cards
 * (and behind More filters) so the page reads as writing, not a tag cloud.
 */
export const BLOG_PRIMARY_FILTERS = [
  "Angular",
  "AWS",
  "Event Horizon",
  "NovaTech",
  "StarLenz",
  "TaskFlow",
  "Graphic Design",
] as const;

export type BlogPrimaryFilter = (typeof BLOG_PRIMARY_FILTERS)[number];

const PRIMARY_SET = new Set<string>(BLOG_PRIMARY_FILTERS);

export function partitionBlogFilters(allTags: string[]): {
  primary: string[];
  more: string[];
} {
  const available = new Set(allTags);
  return {
    primary: BLOG_PRIMARY_FILTERS.filter((tag) => available.has(tag)),
    more: allTags
      .filter((tag) => !PRIMARY_SET.has(tag))
      .sort((a, b) => a.localeCompare(b)),
  };
}

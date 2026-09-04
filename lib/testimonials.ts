/**
 * Recommendations architecture. Do not invent quotes.
 * The homepage section renders nothing while this list is empty.
 */
export type Testimonial = {
  quote: string;
  author: string;
  role?: string;
  organization?: string;
  sourceUrl?: string;
};

export const testimonials: Testimonial[] = [];

export function getTestimonials(): Testimonial[] {
  return testimonials.filter(
    (item) => item.quote.trim().length > 0 && item.author.trim().length > 0,
  );
}

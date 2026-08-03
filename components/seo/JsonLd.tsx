type JsonLdProps = {
  data: Record<string, unknown>;
};

/** Renders schema.org JSON-LD for SEO without client JS. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

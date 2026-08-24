/**
 * Renders a schema.org JSON-LD block. `<` is escaped so a stray
 * closing tag inside authored content can never break out of the
 * script element.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

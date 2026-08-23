/**
 * Renders an executable inline script on the server without React trying to
 * recreate it during client renders (the documented pattern for pre-paint
 * DOM tweaks like theme classes).
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

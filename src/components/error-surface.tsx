import Link from "next/link";
import { BarberPole } from "@/components/ui/barber-pole";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type ErrorSurfaceProps = {
  /** Small uppercase status line above the title, for example "404". */
  eyebrow: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  /** Renders a link when set. Takes precedence over onAction. */
  actionHref?: string;
  /** Renders a retry button when set (client boundaries). */
  onAction?: () => void;
  /** Tertiary line under the card, for example a digest reference. */
  footnote?: React.ReactNode;
  className?: string;
};

/**
 * Shared barber themed surface behind the 404 pages and error boundaries.
 * One pole, one card, one way out. Copy arrives already translated.
 */
export function ErrorSurface({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
  footnote,
  className,
}: ErrorSurfaceProps) {
  return (
    <main
      className={cn(
        "bg-background text-label flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <div className="bg-card shadow-card ring-separator stagger flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl p-8 ring-1">
        <BarberPole className="h-28 w-6" />

        <div className="space-y-2">
          <p className="text-destructive bg-destructive-soft mx-auto w-fit rounded-full px-3 py-1 font-mono text-xs font-medium tracking-[0.25em] uppercase">
            {eyebrow}
          </p>
          <h1 className="max-w-xs text-2xl font-semibold tracking-tight text-balance sm:text-[28px] sm:leading-snug">
            {title}
          </h1>
          <p className="text-label-secondary mx-auto max-w-xs text-[15px] leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div aria-hidden="true" className="bg-separator h-px w-full" />

        {actionHref ? (
          <Link
            href={actionHref}
            className="bg-accent text-on-accent focus-visible:outline-accent inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium transition-transform duration-150 ease-out select-none focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.96]"
          >
            {actionLabel}
          </Link>
        ) : (
          <Button onClick={onAction} size="md">
            {actionLabel}
          </Button>
        )}
      </div>

      {footnote ? (
        <p className="text-label-tertiary mt-6 max-w-xs text-xs leading-relaxed">{footnote}</p>
      ) : null}
    </main>
  );
}

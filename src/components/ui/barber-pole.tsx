import { cn } from "@/lib/cn";

/**
 * A wall mounted barber pole drawn purely from theme tokens so it restyles
 * with every preset. The stripe core drifts one full gradient period per
 * loop for a seamless spin; the global reduced motion guard freezes it.
 */
export function BarberPole({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex flex-col items-center", className)}>
      {/* Mounting caps */}
      <div className="bg-inset ring-separator z-10 h-2 w-3 rounded-[3px] ring-1" />
      <div
        className={cn(
          "ring-separator relative isolate -my-0.5 w-full flex-1 overflow-hidden rounded-full ring-1",
          "shadow-card",
        )}
      >
        <div
          className="animate-pole-slide absolute inset-[-100%]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, var(--destructive) 0px, var(--destructive) 12px, var(--card) 12px, var(--card) 24px, var(--accent) 24px, var(--accent) 36px, var(--card) 36px, var(--card) 48px)",
          }}
        />
        {/* Glass sheen down the left edge */}
        <div className="bg-card/50 absolute inset-y-0 left-0.5 w-1 rounded-full" />
      </div>
      <div className="bg-inset ring-separator z-10 h-2 w-3 rounded-[3px] ring-1" />
    </div>
  );
}

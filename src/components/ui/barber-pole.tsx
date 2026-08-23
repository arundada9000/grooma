import { cn } from "@/lib/cn";

/**
 * A barber pole rendered purely with theme tokens. Stripes drift slowly;
 * the global reduced motion guard freezes them automatically.
 */
export function BarberPole({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "ring-separator relative isolate overflow-hidden rounded-full ring-1",
        className,
      )}
    >
      <div
        className="animate-pole-slide absolute inset-[-100%]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, var(--destructive) 0px, var(--destructive) 12px, var(--card) 12px, var(--card) 24px, var(--accent) 24px, var(--accent) 36px, var(--card) 36px, var(--card) 48px)",
        }}
      />
    </div>
  );
}

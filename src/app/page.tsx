import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Grooma</h1>
      <p className="text-label-secondary max-w-sm text-lg">Your grooming, made simple.</p>
      <p className="text-label-tertiary text-sm">
        Public experience arrives with the customer phase. See docs/IMPLEMENTATION_PLAN.md and
        TRACKER.md for progress.
      </p>
      <Link
        href="/style"
        className="bg-accent-soft text-accent inline-flex h-11 items-center rounded-full px-5 font-medium transition-transform active:scale-[0.96]"
      >
        View design system
      </Link>
    </main>
  );
}

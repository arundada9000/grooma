import type { Metadata } from "next";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BarberPole } from "@/components/ui/barber-pole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToastProvider } from "@/components/ui/toast";
import {
  AlertDialogDemo,
  FeedbackPrefsDemo,
  FormDemo,
  InsetGroupDemo,
  PopoverDemo,
  PressScaleDemo,
  SchemeToggle,
  SegmentedDemo,
  SheetDemo,
  StaggerDemo,
  SwitchDemo,
  TabsDemo,
  ToastDemo,
  TooltipDemo,
} from "./demos";

export const metadata: Metadata = {
  title: "Style",
  description: "Grooma design system reference.",
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-label text-lg font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-label-secondary mt-0.5 text-sm">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

const SWATCHES = [
  ["background", "bg-background"],
  ["card", "bg-card"],
  ["inset", "bg-inset"],
  ["accent", "bg-accent"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["destructive", "bg-destructive"],
] as const;

export default function StylePage() {
  return (
    <ToastProvider>
      <main className="pb-safe mx-auto w-full max-w-2xl space-y-12 px-4 py-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-accent text-xs font-medium tracking-[0.2em] uppercase">Grooma</p>
            <h1 className="text-label mt-1 text-2xl font-semibold tracking-tight">Design system</h1>
            <p className="text-label-secondary mt-1 text-sm">
              iOS HIG flavored primitives. Toggle the scheme to review both appearances.
            </p>
          </div>
          <SchemeToggle />
        </header>

        <Section
          title="Color tokens"
          description="Semantic variables only. No component may hardcode a hex value."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SWATCHES.map(([name, bgClass]) => (
              <div key={name} className="ring-separator overflow-hidden rounded-xl ring-1">
                <div className={`h-14 ${bgClass}`} />
                <p className="bg-card text-label-secondary px-3 py-2 text-xs">{name}</p>
              </div>
            ))}
          </div>
          <div className="bg-card ring-separator flex flex-wrap gap-3 rounded-xl p-4 ring-1">
            <span className="text-label text-[15px]">Primary label</span>
            <span className="text-label-secondary text-[15px]">Secondary label</span>
            <span className="text-label-tertiary text-[15px]">Tertiary label</span>
            <span className="border-separator h-6 flex-1 self-center border-b border-dashed" />
          </div>
        </Section>

        <Section
          title="Typography"
          description="Geist Sans for Latin, Noto Sans Devanagari as companion face for Nepali."
        >
          <Card>
            <CardContent className="space-y-3">
              <p className="text-2xl font-semibold tracking-tight">Your grooming, made simple.</p>
              <p className="text-base">Book a barber in under a minute.</p>
              <p className="text-label-secondary text-sm">Fifteen minute slots, honest prices.</p>
              <p className="text-label-tertiary text-xs">Caption and footnote styles.</p>
              <hr className="border-separator" />
              <p className="text-2xl font-semibold" lang="ne">
                तपाईंको ग्रूमिङ, सजिलो।
              </p>
              <p className="text-base" lang="ne">
                स्वागत छ! आज कति बजे आउनुहुन्छ?
              </p>
              <p className="text-label-secondary text-sm" lang="ne">
                कपाल काट्ने, दाह्री मिलाउने, कपाल धुने सेवाहरू उपलब्ध छन्।
              </p>
              <p className="font-mono text-sm">mono: 09:00 - 18:00 / NPR 300</p>
            </CardContent>
          </Card>
        </Section>

        <Section
          title="Buttons"
          description="Filled, tonal, outline, ghost and destructive. Minimum touch target 44 points."
        >
          <div className="flex max-w-md flex-wrap gap-2">
            <Button>Confirm</Button>
            <Button variant="tonal">Details</Button>
            <Button variant="outline">Reschedule</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="destructive">Delete</Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex max-w-md items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button fullWidth variant="filled">
              Full width
            </Button>
          </div>
        </Section>

        <Section title="Icon buttons, badges, avatars">
          <div className="bg-card ring-separator flex flex-wrap items-center gap-3 rounded-2xl p-4 ring-1">
            <IconButton aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" className="size-5">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path
                  d="m20 20-3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </IconButton>
            <IconButton aria-label="Add" variant="tonal">
              <svg viewBox="0 0 24 24" fill="none" className="size-5">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </IconButton>
            <IconButton aria-label="Favorite" variant="filled">
              <svg viewBox="0 0 24 24" fill="none" className="size-5">
                <path
                  d="M12 20s-7-4.35-9.33-8.11C1 9 2.5 5.5 6 5.5c2 0 3.13 1 4 2.06C10.87 6.5 12 5.5 14 5.5c3.5 0 5 3.5 3.33 6.39C19 15.65 12 20 12 20Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </IconButton>
            <Badge>Pending</Badge>
            <Badge tone="accent">Confirmed</Badge>
            <Badge tone="success">Completed</Badge>
            <Badge tone="warning">No show risk</Badge>
            <Badge tone="destructive">Cancelled</Badge>
            <Avatar name="Bikash Shrestha" />
            <Avatar name="Hari Gurung" size="lg" />
          </div>
        </Section>

        <Section
          title="Cards and inset groups"
          description="Grouped rows with hairline separators mirror iOS lists."
        >
          <div className="space-y-4">
            <Card>
              <CardHeader
                title="Today at Demo Classic"
                subtitle="3 appointments scheduled"
                action={<Badge tone="accent">Live</Badge>}
              />
              <CardContent>
                <p className="text-label-secondary text-sm">
                  Cards group related content on the grouped background.
                </p>
              </CardContent>
            </Card>
            <InsetGroupDemo />
          </div>
        </Section>

        <Section title="Form controls">
          <Card>
            <CardContent className="space-y-4">
              <FormDemo />
              <div className="flex items-center justify-between gap-4 pt-2">
                <div>
                  <p className="text-label text-[15px]">Auto confirm bookings</p>
                  <p className="text-label-secondary text-[13px]">
                    Skip the pending step for trusted customers.
                  </p>
                </div>
                <SwitchDemo />
              </div>
              <SegmentedDemo />
            </CardContent>
          </Card>
        </Section>

        <Section
          title="Overlays"
          description="Sheet, alert dialog, popover and tooltip. Escape closes every layer."
        >
          <div className="flex max-w-lg flex-wrap gap-3">
            <SheetDemo />
            <AlertDialogDemo />
            <PopoverDemo />
            <TooltipDemo />
          </div>
        </Section>

        <Section title="Toasts" description="Transient status at the top, below safe areas.">
          <ToastDemo />
        </Section>

        <Section
          title="Error surfaces"
          description="Barber pole and shared error card behind the 404 pages and boundaries. Try /nope to see one live."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-end justify-center gap-6 py-8">
                <BarberPole className="h-16 w-4" />
                <BarberPole className="h-24 w-5" />
                <BarberPole className="h-32 w-7" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-destructive bg-destructive-soft rounded-full px-3 py-1 font-mono text-xs font-medium tracking-[0.25em] uppercase">
                  404
                </p>
                <p className="text-label max-w-[220px] text-lg font-semibold tracking-tight text-balance">
                  This page isn&apos;t on the menu.
                </p>
                <p className="text-label-secondary max-w-[240px] text-sm leading-relaxed">
                  It must have left with the clippings.
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section title="Feedback states">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
            <Card>
              <EmptyState
                icon={
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 4h12v16l-6-3-6 3V4Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                title="No appointments yet"
                description="New bookings will appear here the moment customers confirm."
              />
            </Card>
          </div>
          <TabsDemo />
        </Section>

        <Section
          title="Motion"
          description="Spring easings, press scale and staggered entrances. Reduced motion preferences disable all of it."
        >
          <StaggerDemo />
        </Section>

        <Section
          title="Press feedback"
          description="Haptics fire on supported devices; sounds are opt in via WebAudio."
        >
          <PressScaleDemo />
        </Section>

        <Section title="Preferences" description="Stored locally, gated before any effect runs.">
          <FeedbackPrefsDemo />
        </Section>

        <Section
          title="Safe areas"
          description="Utilities pt-safe, pb-safe, pl-safe, pr-safe wrap env(safe-area-inset-*). This page pads its bottom edge with pb-safe."
        >
          <Card>
            <CardContent className="pt-safe text-label-secondary text-sm">
              This block adds top safe area padding. Rotate a notched device into landscape to see
              it.
            </CardContent>
          </Card>
        </Section>
      </main>
    </ToastProvider>
  );
}

"use client";

import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InsetGroup, InsetItem, InsetItemButton } from "@/components/ui/inset-group";
import { Popover } from "@/components/ui/popover";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tab, TabPanel, TabsList } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { haptic } from "@/lib/haptics";
import { loadHaptics, loadSound, saveHaptics, saveScheme, saveSound } from "@/lib/preferences";
import { sound } from "@/lib/sound";

export function SchemeToggle() {
  const [scheme, setScheme] = useState<"light" | "dark">("light");

  function apply(next: "light" | "dark") {
    setScheme(next);
    saveScheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    haptic("selection");
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={scheme === "light" ? "filled" : "outline"}
        size="sm"
        onClick={() => apply("light")}
      >
        Light
      </Button>
      <Button
        variant={scheme === "dark" ? "filled" : "outline"}
        size="sm"
        onClick={() => apply("dark")}
      >
        Dark
      </Button>
    </div>
  );
}

export function SwitchDemo() {
  const [enabled, setEnabled] = useState(true);
  return (
    <Switch checked={enabled} onCheckedChange={setEnabled} label="Confirm bookings automatically" />
  );
}

export function SegmentedDemo() {
  const [value, setValue] = useState<"today" | "week" | "all">("today");
  return (
    <SegmentedControl
      ariaLabel="Appointment range"
      value={value}
      onValueChange={setValue}
      options={[
        { value: "today", label: "Today" },
        { value: "week", label: "Week" },
        { value: "all", label: "All" },
      ]}
      className="max-w-xs"
    />
  );
}

export function FormDemo() {
  const [name, setName] = useState("");
  const tooShort = name.length > 0 && name.length < 2;
  return (
    <div className="space-y-4">
      <Field
        label="Customer name"
        htmlFor="demo-name"
        required
        error={tooShort ? "Name looks too short." : undefined}
        helperText="Shown on the appointment list."
      >
        <Input
          id="demo-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ramesh Karki"
          aria-invalid={tooShort || undefined}
        />
      </Field>
      <Field label="Barber" htmlFor="demo-barber">
        <Select id="demo-barber" defaultValue="any">
          <option value="any">Any barber</option>
          <option value="bikash">Bikash</option>
          <option value="hari">Hari</option>
          <option value="anil">Anil</option>
        </Select>
      </Field>
      <Field label="Notes" htmlFor="demo-notes" helperText="Optional. Visible to the shop only.">
        <textarea
          id="demo-notes"
          rows={3}
          className="bg-inset placeholder:text-label-tertiary focus-visible:bg-card focus-visible:ring-accent/60 w-full resize-y rounded-xl border-0 px-3.5 py-2.5 text-[15px] outline-none focus-visible:ring-2"
          placeholder="Prefers a fade."
        />
      </Field>
    </div>
  );
}

export function TabsDemo() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  return (
    <div>
      <TabsList aria-label="Appointments">
        <Tab selected={tab === "upcoming"} onSelected={() => setTab("upcoming")}>
          Upcoming
        </Tab>
        <Tab selected={tab === "past"} onSelected={() => setTab("past")}>
          Past
        </Tab>
      </TabsList>
      <div className="pt-4">
        {tab === "upcoming" ? (
          <TabPanel>
            <p className="text-label-secondary text-sm">
              Tomorrow at 11:00 with Hari. Haircut plus beard.
            </p>
          </TabPanel>
        ) : (
          <TabPanel>
            <p className="text-label-secondary text-sm">
              Last Friday at 15:00 with Bikash. Completed.
            </p>
          </TabPanel>
        )}
      </div>
    </div>
  );
}

export function InsetGroupDemo() {
  return (
    <InsetGroup caption="Pull to refresh is coming with Phase 9.">
      <InsetItem
        leading={<Avatar name="Ramesh Karki" size="sm" />}
        title="Ramesh Karki"
        subtitle="Haircut, 30 min"
        trailing={<Badge tone="accent">11:00</Badge>}
      />
      <InsetItem
        leading={<Avatar name="Sita Adhikari" size="sm" />}
        title="Sita Adhikari"
        subtitle="Beard trim, 20 min"
        trailing={<Badge>11:45</Badge>}
      />
      <InsetItemButton
        title="Add walk-in appointment"
        trailing={<span className="text-accent">+</span>}
        onClick={() => {}}
      />
    </InsetGroup>
  );
}

export function SheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="tonal" onClick={() => setOpen(true)}>
        Open sheet
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Book appointment"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Confirm</Button>
          </div>
        }
      >
        <p className="text-label-secondary pb-2 text-sm">
          On phones this is a bottom sheet with a grab handle. On larger screens it becomes a
          centered dialog.
        </p>
        <FormDemo />
      </Sheet>
    </>
  );
}

export function AlertDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete service
      </Button>
      <AlertDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete this service?"
        description="Upcoming appointments keep their snapshot, but the service disappears from booking."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {}}
      />
    </>
  );
}

export function PopoverDemo() {
  const [choice, setChoice] = useState<string | null>(null);
  return (
    <Popover
      triggerLabel="Status actions"
      align="start"
      trigger={
        <Button variant="outline" size="sm">
          Actions
        </Button>
      }
    >
      <div className="flex flex-col">
        {["Confirm", "Complete", "No show", "Cancel"].map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => setChoice(action)}
            className={`hover:bg-inset rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              choice === action ? "text-accent font-semibold" : "text-label"
            }`}
          >
            {action}
          </button>
        ))}
      </div>
    </Popover>
  );
}

export function TooltipDemo() {
  return (
    <Tooltip label="Opens the day calendar">
      <Button variant="ghost" size="sm">
        Hover or focus me
      </Button>
    </Tooltip>
  );
}

export function ToastDemo() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => toast.push({ title: "Saved", description: "Booking rules updated." })}
      >
        Default toast
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          toast.push({
            title: "Booking confirmed",
            description: "Sita Adhikari at 11:00.",
            variant: "success",
          });
          haptic("success");
          sound("success");
        }}
      >
        Success toast
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          toast.push({
            title: "Slot taken",
            description: "Someone booked this minute first.",
            variant: "error",
          });
          haptic("error");
          sound("error");
        }}
      >
        Error toast
      </Button>
    </div>
  );
}

/** Re mounts the stagger list so the entrance animation replays. */
export function StaggerDemo() {
  const [runId, setRunId] = useState(0);
  const days = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार"];
  return (
    <div className="space-y-3">
      <Button variant="tonal" size="sm" onClick={() => setRunId((current) => current + 1)}>
        Replay stagger
      </Button>
      <ul key={runId} className="stagger space-y-1.5">
        {days.map((day) => (
          <li
            key={day}
            className="bg-inset text-label rounded-xl px-4 py-2.5 text-[15px] transition-transform duration-200 active:scale-[0.98]"
          >
            {day}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeedbackPrefsDemo() {
  const [hapticsOn, setHapticsOn] = useState<boolean | null>(null);
  const [soundOn, setSoundOn] = useState<boolean | null>(null);

  if (hapticsOn === null || soundOn === null) {
    if (typeof window !== "undefined") {
      setHapticsOn(loadHaptics());
      setSoundOn(loadSound());
    }
  }

  return (
    <div className="flex max-w-sm flex-col gap-3">
      <label className="bg-inset flex items-center justify-between gap-4 rounded-xl px-4 py-3">
        <span className="text-label text-[15px]">Haptic feedback</span>
        <Switch
          label="Haptic feedback"
          checked={hapticsOn ?? true}
          onCheckedChange={(next) => {
            setHapticsOn(next);
            saveHaptics(next);
            if (next) {
              setTimeout(() => haptic("medium"), 50);
            }
          }}
        />
      </label>
      <label className="bg-inset flex items-center justify-between gap-4 rounded-xl px-4 py-3">
        <span className="text-label text-[15px]">UI sounds</span>
        <Switch
          label="UI sounds"
          checked={soundOn ?? false}
          onCheckedChange={(next) => {
            setSoundOn(next);
            saveSound(next);
            if (next) {
              setTimeout(() => sound("toggle"), 50);
            }
          }}
        />
      </label>
    </div>
  );
}

export function PressScaleDemo() {
  return (
    <button
      type="button"
      onClick={() => {
        haptic("light");
        sound("tap");
      }}
      className="bg-accent text-on-accent w-full max-w-xs rounded-2xl px-6 py-4 text-[15px] font-medium transition-transform duration-150 ease-out select-none active:scale-[0.96]"
    >
      Tap me: press scale plus feedback
    </button>
  );
}

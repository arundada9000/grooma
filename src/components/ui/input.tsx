import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const CONTROL_CLASSES =
  "w-full rounded-xl border-0 bg-inset px-3.5 text-[15px] text-label placeholder:text-label-tertiary " +
  "outline-none transition-[box-shadow,background-color] duration-150 " +
  "focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-accent/60 " +
  "aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive/60";

export function Input({ className, type = "text", ...rest }: ComponentProps<"input">) {
  return <input type={type} className={cn("h-11", CONTROL_CLASSES, className)} {...rest} />;
}

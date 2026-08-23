import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Textarea({ className, rows = 4, ...rest }: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "bg-inset text-label placeholder:text-label-tertiary w-full resize-y rounded-xl border-0 px-3.5 py-2.5 text-[15px]",
        "transition-[box-shadow,background-color] duration-150 outline-none",
        "focus-visible:bg-card focus-visible:ring-accent/60 focus-visible:ring-2",
        "aria-[invalid=true]:ring-destructive/60 aria-[invalid=true]:ring-2",
        className,
      )}
      {...rest}
    />
  );
}

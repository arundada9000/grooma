import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type IconButtonVariant = "ghost" | "tonal" | "filled";
type IconButtonSize = "sm" | "md" | "lg";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required: icon-only controls must be named for screen readers. */
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
};

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  ghost: "bg-transparent text-label-secondary hover:bg-inset",
  tonal: "bg-accent-soft text-accent",
  filled: "bg-accent text-on-accent",
};

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: "size-8 rounded-lg",
  md: "size-10 rounded-full",
  lg: "size-11 rounded-full",
};

export function IconButton({
  variant = "ghost",
  size = "md",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "touch-manipulate inline-flex items-center justify-center select-none",
        "transition-[transform,background-color,color] duration-150 ease-out",
        "focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2",
        "active:scale-[0.94]",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    />
  );
}

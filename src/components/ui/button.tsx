import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "filled" | "tonal" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the full width of the container. */
  fullWidth?: boolean;
  /** Shows a spinner and blocks interaction while true. */
  loading?: boolean;
  leadingIcon?: ReactNode;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  filled: "bg-accent text-on-accent",
  tonal: "bg-accent-soft text-accent",
  outline: "border border-separator bg-transparent text-label",
  ghost: "bg-transparent text-accent",
  destructive: "bg-destructive text-on-destructive",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "filled",
  size = "md",
  fullWidth,
  loading,
  leadingIcon,
  className,
  disabled,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex touch-manipulation items-center justify-center gap-2 rounded-full font-medium select-none",
        "transition-[transform,opacity,background-color,border-color] duration-150 ease-out",
        "focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2",
        "active:scale-[0.96]",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4 animate-spin">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        leadingIcon
      )}
      {children}
    </button>
  );
}

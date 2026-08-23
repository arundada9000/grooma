import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Labeled form field wrapper. Pass the same htmlFor/id pair to the control
 * so label and helper text wire up for assistive technology.
 */
export function Field({
  label,
  htmlFor,
  required,
  helperText,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helperText?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <label htmlFor={htmlFor} className="text-label mb-1.5 block text-sm font-medium">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-destructive ml-0.5">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-destructive mt-1.5 text-[13px]">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-label-secondary mt-1.5 text-[13px]">{helperText}</p>
      ) : null}
    </div>
  );
}

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...rest }: CardProps) {
  return (
    <div
      className={cn("bg-card shadow-card ring-separator rounded-2xl ring-1", className)}
      {...rest}
    />
  );
}

export type CardHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Trailing element such as an action link or icon button. */
  action?: ReactNode;
};

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-4">
      <div>
        <h3 className="text-label text-[15px] font-semibold">{title}</h3>
        {subtitle ? <p className="text-label-secondary mt-0.5 text-sm">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...rest} />;
}

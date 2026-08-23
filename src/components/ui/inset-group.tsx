import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * iOS style grouped list: a rounded container with hairline dividers.
 * Rows are plain content or interactive via InsetItem.
 */
export function InsetGroup({
  className,
  caption,
  children,
  ...rest
}: HTMLAttributes<HTMLUListElement> & { caption?: ReactNode }) {
  return (
    <div>
      <ul
        role="list"
        className={cn(
          "divide-separator bg-card ring-separator divide-y overflow-hidden rounded-2xl ring-1",
          className,
        )}
        {...rest}
      >
        {children}
      </ul>
      {caption ? <p className="text-label-secondary px-4 pt-2 text-[13px]">{caption}</p> : null}
    </div>
  );
}

type InsetItemBase = {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right aligned content such as a value, badge, or chevron. */
  trailing?: ReactNode;
  className?: string;
};

export function InsetItem({
  leading,
  title,
  subtitle,
  trailing,
  className,
}: InsetItemBase & { onClick?: never }) {
  return (
    <li className={cn("flex items-center gap-3 px-4 py-3", className)}>
      <RowContent leading={leading} title={title} subtitle={subtitle} trailing={trailing} />
    </li>
  );
}

export function InsetItemButton(
  props: InsetItemBase &
    Omit<HTMLAttributes<HTMLButtonElement>, "title" | "className"> & { onClick: () => void },
) {
  const { leading, title, subtitle, trailing, className, ...rest } = props;
  return (
    <li className="flex">
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left",
          "hover:bg-inset focus-visible:bg-inset transition-colors duration-150",
          "focus-visible:outline-accent active:bg-inset focus-visible:outline-2 focus-visible:-outline-offset-2",
          className,
        )}
        {...rest}
      >
        <RowContent leading={leading} title={title} subtitle={subtitle} trailing={trailing} />
      </button>
    </li>
  );
}

function RowContent({ leading, title, subtitle, trailing }: InsetItemBase) {
  return (
    <>
      {leading ? <span className="shrink-0">{leading}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="text-label block truncate text-[15px]">{title}</span>
        {subtitle ? (
          <span className="text-label-secondary mt-0.5 block truncate text-[13px]">{subtitle}</span>
        ) : null}
      </span>
      {trailing ? (
        <span className="text-label-secondary shrink-0 text-[15px]">{trailing}</span>
      ) : null}
    </>
  );
}

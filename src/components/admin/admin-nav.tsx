"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Admin tab bar: top row on desktop, fixed bottom on phones. */

export interface AdminNavItem {
  href: string;
  label: string;
}

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === pathname) return true;
    // The dashboard is the admin index; other tabs are subpaths.
    return href !== items[0]?.href && pathname.startsWith(href);
  }

  return (
    <>
      <nav
        aria-label="Admin"
        className="border-separator bg-background/80 hidden border-b backdrop-blur-xl sm:block"
      >
        <div className="mx-auto flex h-11 w-full max-w-4xl items-center gap-1 px-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-accent-soft text-accent"
                  : "text-label-secondary hover:bg-inset hover:text-label",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <nav
        aria-label="Admin"
        className="bg-background/90 border-separator pb-safe fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl sm:hidden"
      >
        <div className="flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                isActive(item.href) ? "text-accent" : "text-label-secondary",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-1 w-8 rounded-full transition-colors",
                  isActive(item.href) ? "bg-accent" : "bg-transparent",
                )}
              />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

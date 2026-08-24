"use client";

import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";

const DISMISS_KEY = "grooma.install.dismissed-at";
const DISMISS_DAYS = 30;

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const ios = /iP(hone|ad|od)/.test(ua);
  const standalone =
    "standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

/**
 * Android: captures beforeinstallprompt and offers the native install
 * sheet. iOS Safari has no prompt API, so a static Share-sheet hint is
 * shown instead. Both are dismissible for 30 days and never render for
 * already-installed sessions.
 */
export function InstallPrompt() {
  const t = useT();
  const [promptEvent, setPromptEvent] = useState<(Event & { prompt: () => Promise<void> }) | null>(
    null,
  );
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    let dismissedAt = 0;
    try {
      dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
    } catch {
      /* private mode */
    }
    if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as Event & { prompt: () => Promise<void> });
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS gets the static hint shortly after load so it never blocks
    // first paint; Android waits for the browser's own event.
    const timer = window.setTimeout(() => {
      if (isIosSafari()) {
        setShowIosHint(true);
        setVisible(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* private mode */
    }
  }

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    setVisible(false);
  }

  if (!visible) return null;

  const body = showIosHint ? t("pwa.iosHintBody") : t("pwa.installBody");
  const title = showIosHint ? t("pwa.iosHintTitle") : t("pwa.installTitle");

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
      <div className="bg-card shadow-elevated ring-separator mx-auto flex max-w-md items-center gap-3 rounded-2xl p-3.5 ring-1">
        <div className="bg-accent-soft text-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold">
          G
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-label truncate text-sm font-semibold">{title}</p>
          <p className="text-label-secondary mt-0.5 line-clamp-2 text-xs leading-snug">{body}</p>
        </div>
        {showIosHint ? null : (
          <button
            type="button"
            onClick={() => void install()}
            className="bg-accent text-on-accent h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            {t("pwa.installCta")}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("pwa.installDismiss")}
          className={cn(
            "text-label-tertiary hover:bg-inset h-8 w-8 shrink-0 rounded-full text-lg leading-none",
            "transition-colors",
          )}
        >
          ×
        </button>
      </div>
    </div>
  );
}

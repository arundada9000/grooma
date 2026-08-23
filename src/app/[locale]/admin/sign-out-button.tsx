"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { useLocale, useT } from "@/i18n/client";

export function SignOutButton() {
  const router = useRouter();
  const locale = useLocale();
  const t = useT();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    try {
      await authClient.signOut();
      router.replace(`/${locale}/sign-in`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={onSignOut} loading={pending}>
      {t("admin.signOut")}
    </Button>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { useLocale, useT } from "@/i18n/client";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });
      if (signInError) {
        setError(t("signIn.invalidCredentials"));
        return;
      }
      router.replace(searchParams.get("next") ?? `/${locale}/admin`);
      router.refresh();
    } catch {
      setError(t("signIn.genericError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t("signIn.email")} htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label={t("signIn.password")} htmlFor="password">
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {error ? (
          <p
            role="alert"
            className="bg-destructive-soft text-destructive rounded-xl px-3 py-2 text-sm"
          >
            {error}
          </p>
        ) : null}
        <Button type="submit" fullWidth size="lg" loading={pending}>
          {pending ? t("signIn.submitting") : t("signIn.submit")}
        </Button>
      </form>
    </Card>
  );
}

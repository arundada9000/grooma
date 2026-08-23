import type { Metadata } from "next";
import Link from "next/link";
import { getTranslator } from "@/i18n/server";
import { getSession } from "@/lib/auth/session";
import { SignInForm } from "./sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return {
    title: t("signIn.title"),
    description: t("signIn.subtitle"),
  };
}

export default async function SignInPage() {
  const { locale, t } = await getTranslator();
  const session = await getSession();

  if (session) {
    return (
      <main className="bg-background flex min-h-dvh items-center justify-center px-4">
        <div className="bg-card shadow-card ring-separator w-full max-w-sm rounded-2xl p-6 text-center ring-1">
          <p className="text-label-secondary text-sm">{t("admin.signedInAs")}</p>
          <p className="text-label mt-1 font-medium">{session.user.email}</p>
          <Link
            href={`/${locale}/admin`}
            className="bg-accent text-on-accent mt-4 inline-flex h-11 w-full items-center justify-center rounded-full font-medium transition-transform active:scale-[0.98]"
          >
            {t("signIn.continueToDashboard")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <p className="text-label-tertiary text-xs tracking-[0.2em] uppercase">Grooma</p>
          <h1 className="text-label mt-2 text-2xl font-semibold tracking-tight">
            {t("signIn.title")}
          </h1>
          <p className="text-label-secondary mt-1 text-sm">{t("home.tagline")}</p>
        </header>
        <SignInForm />
      </div>
    </main>
  );
}

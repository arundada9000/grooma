import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Access the Grooma admin dashboard.",
};

export default async function SignInPage() {
  const session = await getSession();
  if (session) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-neutral-500">Signed in as</p>
          <p className="mt-1 font-medium text-neutral-900">{session.user.email}</p>
          <a
            href="/admin"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-neutral-900 font-medium text-white transition-transform active:scale-[0.98]"
          >
            Continue to dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <p className="text-xs tracking-[0.2em] text-neutral-400 uppercase">Grooma</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">Sign in</h1>
          <p className="mt-1 text-sm text-neutral-500">Your grooming, made simple.</p>
        </header>
        <SignInForm />
      </div>
    </main>
  );
}

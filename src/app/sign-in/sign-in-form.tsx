"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";

export function SignInForm() {
  const router = useRouter();
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
        setError("Invalid email or password.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-base text-neutral-900 transition outline-none focus:border-neutral-400 focus:bg-white"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-base text-neutral-900 transition outline-none focus:border-neutral-400 focus:bg-white"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 h-11 w-full rounded-full bg-neutral-900 font-medium text-white transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

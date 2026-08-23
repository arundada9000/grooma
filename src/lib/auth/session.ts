import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type AuthSession } from "./server";

export type { AuthSession };

export async function getSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}

export async function requireOwner(): Promise<AuthSession> {
  const session = await requireUser();
  if (session.user.role !== "OWNER") {
    redirect("/sign-in?error=forbidden");
  }
  return session;
}

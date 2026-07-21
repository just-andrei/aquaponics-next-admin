"use client";

import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { getAdminAccess, getSignInErrorMessage } from "@/lib/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const { accessError, clearAccessError, isActiveAdmin, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isActiveAdmin) {
      router.replace("/admin/dashboard");
    }
  }, [isActiveAdmin, isLoading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    clearAccessError();

    if (!isFirebaseConfigured || !auth) {
      setFormError(
        "Firebase is not configured. Add the Firebase values to .env.local and restart the app.",
      );
      return;
    }

    if (!email.trim() || !password) {
      setFormError("Enter your email address and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const adminAccess = await getAdminAccess(credential.user);

      if (!adminAccess.isActiveAdmin) {
        await signOut(auth);
        setFormError(adminAccess.reason);
        return;
      }

      router.replace("/admin/dashboard");
    } catch (error) {
      setFormError(getSignInErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || isActiveAdmin) {
    return (
      <PublicPageShell>
        <main className="flex min-h-[60vh] items-center justify-center px-6 py-12">
          <p className="text-sm text-slate-600">Checking administrator session...</p>
        </main>
      </PublicPageShell>
    );
  }

  const errorMessage = formError ?? accessError;

  return (
    <PublicPageShell>
      <main className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center bg-slate-50 px-4 py-14 sm:px-6">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Aquaponics Admin Portal</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Administrator sign in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sign in with an active administrator account to access the web admin portal.
        </p>

        {errorMessage ? (
          <p
            aria-live="polite"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="email">
              Email address
            </label>
            <input
              autoComplete="email"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-950 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              disabled={isSubmitting}
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-950 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              disabled={isSubmitting}
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </div>

          <button
            className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <Link className="mt-6 inline-flex rounded-lg text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100" href="/">
          Return to public website
        </Link>
      </section>
      </main>
    </PublicPageShell>
  );
}

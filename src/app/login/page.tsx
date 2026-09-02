"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_PASSWORD_LENGTH, emailProblem, passwordProblem } from "@/lib/auth/types";

type Mode = "login" | "signup";

/**
 * Only same-origin paths are followed after signing in, so a link like
 * `/login?next=https://evil.example` can't turn this form into an open
 * redirect. Anything else falls back to the library.
 */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/documents/library";
}

function LoginForm() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Check the same rules the server does, so obvious mistakes don't need a
    // round trip. The server checks them again — this is convenience only.
    if (mode === "signup") {
      const problem = emailProblem(email) ?? passwordProblem(password);
      if (problem) {
        setError(problem);
        return;
      }
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }

      // Full navigation, not router.push: the session cookie has just
      // changed, and a soft navigation would keep the mounted header (and any
      // cached route data) on the signed-out answer it already fetched.
      window.location.assign(next);
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-serif text-2xl font-medium tracking-tight">
        {mode === "login" ? "Log in" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "login"
          ? "Access your saved reports and uploaded documents."
          : "Keep your property documents in one place, and pick up a check where you left off."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          {mode === "signup" ? (
            <p className="text-xs text-muted-foreground">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : null}
          {mode === "login" ? "Log in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? "New to TitleClear.ai?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
        >
          {mode === "login" ? "Create an account" : "Log in"}
        </button>
      </p>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        <Link
          href="/check"
          className="underline decoration-border underline-offset-4 hover:decoration-foreground"
        >
          Continue without an account
        </Link>
        {" · "}
        A check runs without one; saved documents need an account.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        {/* useSearchParams needs a Suspense boundary to keep this page static. */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

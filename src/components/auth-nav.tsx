"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicUser } from "@/lib/auth/types";

/**
 * The account corner of the site header.
 *
 * Deliberately a client component that asks `/api/auth/me` after mount rather
 * than a server read of the session: the header is on every page, and reading
 * cookies during render would opt the whole marketing side of the site out of
 * static rendering for the sake of one label. The cost is that the corner is
 * blank for one paint — which is why it renders nothing at all until the
 * answer arrives, instead of flashing "Log in" at someone already signed in.
 */
export function AuthNav() {
  const [user, setUser] = useState<PublicUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    // Reading who is signed in is a fetch from the server, not derived state.
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!cancelled) setUser(data.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Full reload so any page showing this account's data re-fetches as a
    // signed-out visitor rather than keeping stale content on screen.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  }

  if (user === undefined) {
    // Hold the space so the header doesn't jump when the answer lands.
    return <span className="hidden h-8 w-16 sm:block" aria-hidden />;
  }

  if (!user) {
    return (
      <Button
        variant="ghost"
        className="hidden sm:inline-flex"
        render={<Link href="/login">Log in</Link>}
        nativeButton={false}
      />
    );
  }

  return (
    <div className="hidden items-center gap-1 sm:flex">
      <Link
        href="/documents/library"
        className="max-w-[14rem] truncate px-2 text-sm text-muted-foreground hover:text-foreground"
        title={user.email}
      >
        {user.email}
      </Link>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Log out"
        onClick={handleLogout}
        className="text-muted-foreground hover:text-foreground"
      >
        <LogOut />
      </Button>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthNav } from "@/components/auth-nav";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-lg font-semibold tracking-tight">
            TitleClear
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">.ai</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
          <Link href="/#how-it-works" className="hover:text-foreground">
            How it works
          </Link>
          <Link href="/#coverage" className="hover:text-foreground">
            Coverage
          </Link>
          <Link href="/documents" className="hover:text-foreground">
            Documents
          </Link>
          <Link href="/jantri" className="hover:text-foreground">
            Jantri rates
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <AuthNav />
          <Button render={<Link href="/check">Check a property</Link>} nativeButton={false} />
        </div>
      </div>
    </header>
  );
}

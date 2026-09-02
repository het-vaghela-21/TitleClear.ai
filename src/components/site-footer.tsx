export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
        <p className="max-w-2xl">
          TitleClear.ai gathers and cross-checks public records to flag risks
          early. It is a preliminary due-diligence aid, not a legal title
          certificate, and does not replace an advocate&apos;s review.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wide">
          <span>Coverage: Gujarat</span>
          <span>&copy; {new Date().getFullYear()} TitleClear.ai</span>
        </div>
      </div>
    </footer>
  );
}

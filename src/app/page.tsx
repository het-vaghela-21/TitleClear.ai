import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TitleSeal } from "@/components/title-seal";
import { Button } from "@/components/ui/button";
import { SOURCE_LABELS, SOURCE_ORDER } from "@/lib/connectors/types";

const sourceCopy: Record<string, string> = {
  land_records: "7/12 extract, 8-A, and mutation entries showing how the plot has changed hands.",
  registration: "Sale deeds and the encumbrance certificate from the sub-registrar's office.",
  rera: "Project registration status, for plots that fall under an active RERA scheme.",
  tax: "Municipal or panchayat tax receipts and any outstanding dues.",
  court: "Civil court and revenue tribunal search for pending cases naming the survey number.",
  map: "Village map and boundary overlay, to check the plot lines up with official records.",
};

const steps = [
  {
    n: "01",
    title: "Enter the plot details",
    body: "District, taluka or ward, and the survey or khata number — the same identifiers on any land record.",
  },
  {
    n: "02",
    title: "We assemble the records",
    body: "Land records, registration, RERA, tax, court and map sources are checked and cross-referenced.",
  },
  {
    n: "03",
    title: "Get your Title Clear Score",
    body: "A plain-language report with a 0–100 score, flagged issues, and concrete next steps.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">
                Property due-diligence &middot; Gujarat
              </p>
              <h1 className="mt-4 max-w-xl font-serif text-4xl font-medium leading-[1.15] tracking-tight sm:text-5xl">
                Know what you&apos;re buying, before you sign.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
                Enter a plot&apos;s district, survey and khata number.
                We gather the land, registration, tax and court records that
                matter and flag what needs a closer look — before you commit
                to a purchase.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button size="lg" render={<Link href="/check">Check a property</Link>} nativeButton={false} />
                <Link
                  href="#how-it-works"
                  className="text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                >
                  See how it works
                </Link>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                Software does the data-gathering and cross-checking. A human
                advocate reviews and signs off on the premium tier.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    Survey No. 142/2 &middot; Sanand, Ahmedabad
                  </p>
                  <p className="mt-1 font-serif text-lg">Sample report preview</p>
                </div>
              </div>
              <div className="flex items-center gap-6 py-6">
                <TitleSeal score={61} band="amber" size={112} />
                <ul className="flex-1 space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">7/12 Extract</span>
                    <span className="text-risk-green">Found</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mortgage Release Deed</span>
                    <span className="text-risk-red">Missing</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Court Case Search</span>
                    <span className="text-risk-amber">Pending</span>
                  </li>
                </ul>
              </div>
              <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                Preliminary check only — not a legal title certificate.
              </p>
            </div>
          </div>
        </section>

        {/* What we check */}
        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="font-serif text-2xl font-medium">What we check</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Six sources, cross-referenced against each other so gaps and
              contradictions surface instead of staying buried in separate
              offices.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SOURCE_ORDER.map((source) => (
                <div key={source} className="rounded-lg border border-border bg-card p-5">
                  <p className="font-mono text-[11px] uppercase tracking-wide text-primary">
                    {SOURCE_LABELS[source]}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {sourceCopy[source]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-serif text-2xl font-medium">How it works</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n}>
                <p className="font-mono text-sm text-primary">{step.n}</p>
                <h3 className="mt-3 font-serif text-lg font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Why not just a lawyer */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="max-w-2xl">
              <h2 className="font-serif text-2xl font-medium">
                This doesn&apos;t replace an advocate
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                A lawyer&apos;s review is still what makes a title legally
                sound. What TitleClear.ai does is the slow part first —
                pulling records from six different offices and lining them up
                so an advocate starts from a clear picture instead of a blank
                one. On the premium tier, a human advocate reviews the
                assembled report and signs off before you rely on it.
              </p>
            </div>
          </div>
        </section>

        {/* Coverage */}
        <section id="coverage" className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="font-serif text-2xl font-medium">Coverage</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              TitleClear.ai currently covers plots in{" "}
              <span className="font-medium text-foreground">Gujarat</span>,
              rural and urban. Record formats and offices differ state by
              state, so we&apos;re rolling out one state at a time rather than
              guessing at the rest.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="font-serif text-2xl font-medium sm:text-3xl">
            Start with the plot details you already have.
          </h2>
          <div className="mt-8">
            <Button size="lg" render={<Link href="/check">Check a property</Link>} nativeButton={false} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

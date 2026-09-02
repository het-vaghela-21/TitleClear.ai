"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TitleSeal } from "@/components/title-seal";
import { Button } from "@/components/ui/button";
import { loadReportBundle } from "@/lib/property-store";
import { formatDate, recordStatusMeta, severityMeta } from "@/lib/risk";
import { SOURCE_LABELS, SOURCE_ORDER } from "@/lib/connectors/types";
import type { ReportBundle } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const [bundle, setBundle] = useState<ReportBundle | null | undefined>(undefined);

  useEffect(() => {
    // sessionStorage only exists client-side, so the report bundle can only
    // be read after mount — a one-time sync with that external store.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBundle(loadReportBundle(params.id));
  }, [params.id]);

  if (bundle === undefined) return null;

  if (bundle === null) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1">
          <section className="mx-auto max-w-lg px-6 py-20 text-center">
            <h1 className="font-serif text-2xl font-medium">Report not found</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This report has expired or the link is incorrect.
            </p>
            <Button className="mt-6" render={<Link href="/check">Start a new check</Link>} nativeButton={false} />
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  const { property, report, owners, records, flags } = bundle;

  const location =
    property.areaKind === "rural"
      ? [property.village, property.taluka, property.district].filter(Boolean).join(", ")
      : [property.citySurveyArea, property.ward, property.district].filter(Boolean).join(", ");

  const recordsBySource = SOURCE_ORDER.map((source) => ({
    source,
    label: SOURCE_LABELS[source],
    items: records.filter((r) => r.source === source),
  }));

  const encumbranceRecords = records.filter((r) => /encumbrance|mortgage/i.test(r.label));
  const taxRecords = records.filter((r) => r.source === "tax");
  const reraRecords = records.filter((r) => r.source === "rera");

  const nextSteps = Array.from(new Set(flags.map((f) => f.recommendedNextStep)));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-14">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            Step 3 of 3 &middot; Title Clear Report
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight">
            {location || "Property report"}
          </h1>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            Survey No. {property.surveyNo}
            {property.khataNo ? ` · Khata No. ${property.khataNo}` : ""} &middot;{" "}
            {property.district}, {property.state}
          </p>

          {/* Score + summary */}
          <div className="mt-10 grid gap-8 rounded-lg border border-border bg-card p-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <TitleSeal score={report.titleClearScore} band={report.band} />
            <div>
              <h2 className="font-serif text-xl font-medium">Title Clear Score</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {report.summary}
              </p>
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                Generated {formatDate(report.generatedAt)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-border bg-secondary/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            This is a preliminary due-diligence check assembled from public
            records. It is not a legal title certificate — consult an
            advocate before relying on it for a transaction.
          </div>

          {/* Property summary */}
          <section className="mt-12">
            <h2 className="font-serif text-xl font-medium">Property summary</h2>
            <dl className="mt-4 grid grid-cols-2 gap-6 rounded-lg border border-border bg-card p-6 sm:grid-cols-4">
              <SummaryItem label="Land type" value={property.landType.replace("-", " ")} />
              <SummaryItem label="Area type" value={property.areaKind} />
              <SummaryItem label="Survey no." value={property.surveyNo ?? "—"} />
              <SummaryItem label="Khata no." value={property.khataNo ?? "—"} />
            </dl>
          </section>

          {/* Ownership timeline */}
          <section className="mt-12">
            <h2 className="font-serif text-xl font-medium">Ownership timeline</h2>
            <ol className="mt-4 space-y-0 border-l border-border pl-6">
              {owners.map((owner, i) => (
                <li key={owner.id} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatDate(owner.ownershipStart)} &ndash; {formatDate(owner.ownershipEnd)}
                  </p>
                  <p className="mt-1 font-medium">
                    {owner.name}
                    {i === owners.length - 1 && (
                      <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-normal text-accent-foreground">
                        Current owner
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {owner.transactionType}
                    {owner.documentRef ? ` — ${owner.documentRef}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* Document checklist */}
          <section className="mt-12">
            <h2 className="font-serif text-xl font-medium">Document checklist</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {recordsBySource.map(({ source, label, items }) => (
                <div key={source} className="rounded-lg border border-border bg-card p-4">
                  <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {items.map((item) => {
                      const meta = recordStatusMeta[item.status];
                      return (
                        <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                          <span>
                            {item.label}
                            {item.note && (
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {item.note}
                              </span>
                            )}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                              meta.bg,
                              meta.text,
                            )}
                          >
                            {meta.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Encumbrance / Tax / RERA */}
          <section className="mt-12 grid gap-6 sm:grid-cols-3">
            <StatusCard title="Encumbrance / mortgage" records={encumbranceRecords} />
            <StatusCard title="Tax status" records={taxRecords} />
            <StatusCard title="RERA status" records={reraRecords} />
          </section>

          {/* Flags */}
          <section className="mt-12">
            <h2 className="font-serif text-xl font-medium">Flagged issues</h2>
            {flags.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No issues flagged.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {flags.map((flag) => {
                  const meta = severityMeta[flag.severity];
                  return (
                    <li key={flag.id} className="rounded-lg border border-border bg-card p-5">
                      <div className="flex items-center gap-3">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", meta.bg, meta.text)}>
                          {meta.label} severity
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                          {flag.category}
                        </span>
                      </div>
                      <p className="mt-3 font-medium">{flag.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {flag.description}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Next steps */}
          <section className="mt-12">
            <h2 className="font-serif text-xl font-medium">Next steps</h2>
            {nextSteps.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Nothing outstanding — this is a good starting point to move ahead, alongside your advocate&apos;s standard review.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {nextSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 rounded-lg border border-border bg-card p-4 text-sm">
                    <span className="font-mono text-muted-foreground">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-border pt-8">
            <Button render={<Link href="/check">Check another property</Link>} nativeButton={false} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium capitalize">{value}</dd>
    </div>
  );
}

function StatusCard({
  title,
  records,
}: {
  title: string;
  records: ReportBundle["records"];
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="font-serif text-base font-medium">{title}</p>
      {records.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No related records.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {records.map((r) => {
            const meta = recordStatusMeta[r.status];
            return (
              <li key={r.id} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span>{r.label}</span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", meta.bg, meta.text)}>
                    {meta.label}
                  </span>
                </div>
                {r.note && <p className="mt-0.5 text-xs text-muted-foreground">{r.note}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

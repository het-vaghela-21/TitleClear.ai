"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { mockConnectors } from "@/lib/connectors/mock-connectors";
import { buildReportBundle } from "@/lib/mock/build-report";
import { loadProperty, saveReportBundle } from "@/lib/property-store";
import type { Property, RecordSourceKey } from "@/lib/types";
import { cn } from "@/lib/utils";

type SourceState = "pending" | "checking" | "done";

export default function AssemblingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null | undefined>(undefined);
  const [statuses, setStatuses] = useState<Record<RecordSourceKey, SourceState>>(() =>
    Object.fromEntries(mockConnectors.map((c) => [c.source, "pending"])) as Record<
      RecordSourceKey,
      SourceState
    >,
  );
  const started = useRef(false);

  useEffect(() => {
    // sessionStorage only exists client-side, so the submitted property can
    // only be read after mount — a one-time sync with that external store.
    const loaded = loadProperty(params.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProperty(loaded);
  }, [params.id]);

  useEffect(() => {
    if (!property || started.current) return;
    started.current = true;

    setStatuses((prev) => {
      const next = { ...prev };
      for (const c of mockConnectors) next[c.source] = "checking";
      return next;
    });

    Promise.all(
      mockConnectors.map((connector) =>
        connector.fetchRecords(property).then(() => {
          setStatuses((prev) => ({ ...prev, [connector.source]: "done" }));
        }),
      ),
    ).then(() => {
      const bundle = buildReportBundle(property);
      saveReportBundle(bundle);
      router.push(`/report/${property.id}`);
    });
  }, [property, router]);

  if (property === null) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1">
          <section className="mx-auto max-w-lg px-6 py-20 text-center">
            <h1 className="font-serif text-2xl font-medium">We couldn&apos;t find that request</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Plot details may have expired. Start a new check.
            </p>
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  const doneCount = Object.values(statuses).filter((s) => s === "done").length;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-lg px-6 py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            Step 2 of 3
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight">
            Assembling your report
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Checking {mockConnectors.length} sources for{" "}
            {property?.village ?? property?.ward ?? property?.district}, Survey No.{" "}
            {property?.surveyNo}. This usually takes under a minute.
          </p>

          <ul className="mt-10 space-y-3">
            {mockConnectors.map((connector) => {
              const status = statuses[connector.source];
              return (
                <li
                  key={connector.source}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <span className="text-sm font-medium">{connector.displayName}</span>
                  <StatusBadge status={status} />
                </li>
              );
            })}
          </ul>

          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(doneCount / mockConnectors.length) * 100}%` }}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function StatusBadge({ status }: { status: SourceState }) {
  if (status === "done") {
    return <span className="text-sm font-medium text-risk-green">Checked</span>;
  }
  if (status === "checking") {
    return (
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <span
          className={cn(
            "h-2 w-2 animate-pulse rounded-full bg-primary",
          )}
        />
        Checking…
      </span>
    );
  }
  return <span className="text-sm text-muted-foreground">Queued</span>;
}

"use client";

import { Fragment, useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type OcrProviderId = "tesseract" | "google" | "surya" | "vlm";

const PROVIDER_OPTIONS: Array<{ id: OcrProviderId; label: string; note: string }> = [
  { id: "tesseract", label: "Tesseract (local)", note: "Real, offline, free" },
  { id: "google", label: "Google Cloud Vision", note: "Real, needs GOOGLE_VISION_API_KEY" },
  { id: "surya", label: "Surya", note: "Stub — not implemented yet" },
  {
    id: "vlm",
    label: "Qwen2.5-VL",
    note: "Stub — best open-source bet for handwritten Gujarati, needs a hosting decision first (see src/lib/ocr/README.md)",
  },
];

interface Fixture {
  id: string;
  docType: string;
  fields: Record<string, unknown>;
  referenceText: string;
}

interface RunResult {
  provider: string;
  ocr: { rawText: string; confidence: number; detectedLangs: string[] };
  extraction: Record<string, unknown>;
  fieldComparison: Array<{ field: string; expected: unknown; actual: unknown; correct: boolean }>;
  metrics: { cerEn: number; cerGu: number; fieldAccuracy: number; correct: number; total: number };
}

interface HarnessResult {
  provider: string;
  docCount: number;
  cerEn: number;
  cerGu: number;
  fieldAccuracy: number;
  perDoc: Array<{ id: string; cerEn: number; cerGu: number; fieldAccuracy: number }>;
}

interface CompareRow {
  provider: OcrProviderId;
  displayName: string;
  status: "ok" | "not_configured" | "not_implemented" | "error";
  latencyMs: number;
  confidence?: number;
  rawText?: string;
  cerEn?: number;
  cerGu?: number;
  fieldAccuracy?: number;
  message?: string;
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

const STATUS_META: Record<CompareRow["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ok: { label: "ok", variant: "default" },
  not_configured: { label: "not configured", variant: "secondary" },
  not_implemented: { label: "not implemented", variant: "outline" },
  error: { label: "error", variant: "destructive" },
};

export default function OcrDemoPage() {
  const [fixtures, setFixtures] = useState<Fixture[] | null>(null);
  const [fixturesError, setFixturesError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<OcrProviderId>("tesseract");
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);

  const [harnessProvider, setHarnessProvider] = useState<OcrProviderId>("tesseract");
  const [harnessRunning, setHarnessRunning] = useState(false);
  const [harnessError, setHarnessError] = useState<string | null>(null);
  const [harness, setHarness] = useState<HarnessResult | null>(null);

  const [compareRunning, setCompareRunning] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareRows, setCompareRows] = useState<CompareRow[] | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<OcrProviderId | null>(null);

  useEffect(() => {
    fetch("/api/ocr-demo/fixtures")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load fixtures");
        return data.fixtures as Fixture[];
      })
      .then((list) => {
        setFixtures(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch((err) => setFixturesError(err instanceof Error ? err.message : String(err)));
  }, []);

  async function runOcr() {
    if (!selectedId) return;
    setRunning(true);
    setRunError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ocr-demo/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, provider: selectedProvider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "OCR run failed");
      setResult(data);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function runHarnessAll() {
    setHarnessRunning(true);
    setHarnessError(null);
    setHarness(null);
    try {
      const res = await fetch(`/api/ocr-demo/harness?provider=${harnessProvider}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Harness run failed");
      setHarness(data);
    } catch (err) {
      setHarnessError(err instanceof Error ? err.message : String(err));
    } finally {
      setHarnessRunning(false);
    }
  }

  async function runCompare() {
    if (!selectedId) return;
    setCompareRunning(true);
    setCompareError(null);
    setCompareRows(null);
    setExpandedProvider(null);
    try {
      const res = await fetch("/api/ocr-demo/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Comparison failed");
      setCompareRows(data.results);
    } catch (err) {
      setCompareError(err instanceof Error ? err.message : String(err));
    } finally {
      setCompareRunning(false);
    }
  }

  const selectedFixture = fixtures?.find((f) => f.id === selectedId);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-14">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            OCR Module &middot; Demo
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight">
            Gujarati + English document OCR
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Runs the OCR + field-extraction pipeline against synthetic RoR /
            Index-2-style documents rendered with mixed Gujarati and English
            text. Provider-abstracted — pick any registered OCR source below.
            No real documents or government portals are involved — see{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              src/lib/ocr/README.md
            </code>{" "}
            for scope notes.
          </p>

          {fixturesError && (
            <div className="mt-8 rounded-lg border border-risk-red/30 bg-risk-red-bg px-4 py-3 text-sm text-risk-red">
              {fixturesError}
            </div>
          )}

          {fixtures && fixtures.length > 0 && (
            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              {/* Left: document picker + image */}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-52">
                    <Select value={selectedId} onValueChange={(v) => v && setSelectedId(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a document" />
                      </SelectTrigger>
                      <SelectContent>
                        {fixtures.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.id} &middot; {f.docType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-56">
                    <Select
                      value={selectedProvider}
                      onValueChange={(v) => v && setSelectedProvider(v as OcrProviderId)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="OCR provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_OPTIONS.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={runOcr} disabled={running}>
                    {running ? "Running OCR…" : "Run OCR"}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {PROVIDER_OPTIONS.find((p) => p.id === selectedProvider)?.note}
                </p>

                {selectedFixture && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/ocr-demo/image/${selectedFixture.id}`}
                    alt={`Synthetic ${selectedFixture.docType} document`}
                    className="mt-4 w-full rounded-xl ring-1 ring-foreground/10"
                  />
                )}
              </div>

              {/* Right: OCR + extraction results */}
              <div className="space-y-6">
                {runError && (
                  <div className="rounded-lg border border-risk-red/30 bg-risk-red-bg px-4 py-3 text-sm text-risk-red">
                    {runError}
                  </div>
                )}

                {result && (
                  <>
                    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                      <div className="flex items-center justify-between">
                        <h2 className="font-serif text-lg font-medium">Raw OCR text</h2>
                        <Badge variant="outline">{result.provider}</Badge>
                      </div>
                      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm leading-relaxed">
                        {result.ocr.rawText}
                      </pre>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Confidence: {pct(result.ocr.confidence)} &middot; Languages:{" "}
                        {result.ocr.detectedLangs.join(", ")}
                      </p>
                    </div>

                    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                      <h2 className="font-serif text-lg font-medium">
                        Extracted fields vs. ground truth
                      </h2>
                      <table className="mt-3 w-full text-sm">
                        <tbody>
                          {result.fieldComparison.map((row) => (
                            <tr key={row.field} className="border-t border-border">
                              <td className="py-1.5 pr-2 font-mono text-xs text-muted-foreground">
                                {row.field}
                              </td>
                              <td className="py-1.5 pr-2">{String(row.expected)}</td>
                              <td
                                className={cn(
                                  "py-1.5 pr-2",
                                  row.correct ? "text-risk-green" : "text-risk-red",
                                )}
                              >
                                {row.actual === null ? "—" : String(row.actual)}
                              </td>
                              <td className="py-1.5 text-right">
                                <Badge variant={row.correct ? "default" : "destructive"}>
                                  {row.correct ? "match" : "miss"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Metric label="CER (English)" value={pct(result.metrics.cerEn)} />
                      <Metric label="CER (Gujarati)" value={pct(result.metrics.cerGu)} />
                      <Metric
                        label="Field accuracy"
                        value={`${result.metrics.correct}/${result.metrics.total}`}
                      />
                    </div>
                  </>
                )}

                {!result && !runError && (
                  <div className="flex h-full min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                    Pick a document and provider, then click &ldquo;Run OCR&rdquo;
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compare providers on this document */}
          <div className="mt-14 border-t border-border pt-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-medium tracking-tight">
                  Compare OCR providers
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Runs the same document above through every registered
                  provider and reports what actually happened for each —
                  including the ones that aren&apos;t usable in this
                  environment (missing credentials, or documented stubs).
                  Nothing here is precomputed per provider.
                </p>
              </div>
              <Button onClick={runCompare} disabled={compareRunning || !selectedId} variant="outline">
                {compareRunning ? "Comparing…" : "Compare providers"}
              </Button>
            </div>

            {compareError && (
              <div className="mt-6 rounded-lg border border-risk-red/30 bg-risk-red-bg px-4 py-3 text-sm text-risk-red">
                {compareError}
              </div>
            )}

            {compareRows && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Provider</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Latency</th>
                      <th className="pb-2 font-medium">Confidence</th>
                      <th className="pb-2 font-medium">CER (EN)</th>
                      <th className="pb-2 font-medium">CER (GU)</th>
                      <th className="pb-2 font-medium">Field acc.</th>
                      <th className="pb-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map((row) => (
                      <Fragment key={row.provider}>
                        <tr className="border-t border-border">
                          <td className="py-2 pr-2">
                            <span className="font-medium">{row.displayName}</span>
                            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                              ({row.provider})
                            </span>
                          </td>
                          <td className="py-2 pr-2">
                            <Badge variant={STATUS_META[row.status].variant}>
                              {STATUS_META[row.status].label}
                            </Badge>
                          </td>
                          <td className="py-2 pr-2">{row.latencyMs} ms</td>
                          <td className="py-2 pr-2">
                            {row.confidence !== undefined ? pct(row.confidence) : "—"}
                          </td>
                          <td className="py-2 pr-2">{row.cerEn !== undefined ? pct(row.cerEn) : "—"}</td>
                          <td className="py-2 pr-2">{row.cerGu !== undefined ? pct(row.cerGu) : "—"}</td>
                          <td className="py-2 pr-2">
                            {row.fieldAccuracy !== undefined ? pct(row.fieldAccuracy) : "—"}
                          </td>
                          <td className="py-2 text-right">
                            {(row.rawText || row.message) && (
                              <button
                                type="button"
                                className="text-xs text-primary hover:underline"
                                onClick={() =>
                                  setExpandedProvider(expandedProvider === row.provider ? null : row.provider)
                                }
                              >
                                {expandedProvider === row.provider ? "hide" : "details"}
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedProvider === row.provider && (
                          <tr className="border-t border-border">
                            <td colSpan={8} className="py-3">
                              {row.rawText ? (
                                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs leading-relaxed">
                                  {row.rawText}
                                </pre>
                              ) : (
                                <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                                  {row.message}
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Accuracy across the full set */}
          <div className="mt-14 border-t border-border pt-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-medium tracking-tight">
                  Accuracy across the synthetic set
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Runs the full pipeline over every synthetic document and scores
                  character error rate (per script) and field-level accuracy.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-56">
                  <Select
                    value={harnessProvider}
                    onValueChange={(v) => v && setHarnessProvider(v as OcrProviderId)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="OCR provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDER_OPTIONS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={runHarnessAll} disabled={harnessRunning} variant="outline">
                  {harnessRunning ? "Running harness…" : "Run harness"}
                </Button>
              </div>
            </div>

            {harnessError && (
              <div className="mt-6 rounded-lg border border-risk-red/30 bg-risk-red-bg px-4 py-3 text-sm text-risk-red">
                {harnessError}
              </div>
            )}

            {harness && (
              <>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <Metric label="CER (English)" value={pct(harness.cerEn)} big />
                  <Metric label="CER (Gujarati)" value={pct(harness.cerGu)} big />
                  <Metric label="Field accuracy" value={pct(harness.fieldAccuracy)} big />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {harness.docCount} documents &middot; provider: {harness.provider}
                </p>

                <table className="mt-6 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Document</th>
                      <th className="pb-2 font-medium">CER (EN)</th>
                      <th className="pb-2 font-medium">CER (GU)</th>
                      <th className="pb-2 font-medium">Field accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {harness.perDoc.map((d) => (
                      <tr key={d.id} className="border-t border-border">
                        <td className="py-1.5 font-mono text-xs">{d.id}</td>
                        <td className="py-1.5">{pct(d.cerEn)}</td>
                        <td className="py-1.5">{pct(d.cerGu)}</td>
                        <td className="py-1.5">{pct(d.fieldAccuracy)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Metric({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded-xl bg-card p-4 text-center ring-1 ring-foreground/10">
      <p className={cn("font-serif font-medium tracking-tight", big ? "text-3xl" : "text-xl")}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

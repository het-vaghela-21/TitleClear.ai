"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, Info, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VADODARA_META } from "@/lib/jantri/meta";
import type {
  JantriResult,
  JantriSearchResponse,
  MatchInfo,
  RateLine,
  VillageHit,
} from "@/lib/jantri/types";
import { cn } from "@/lib/utils";

/**
 * Jantri (ASR) rate lookup. The dataset lives server-side; this page talks
 * to /api/jantri/villages (autocomplete) and /api/jantri/search (results).
 */

type Unit = "sqm" | "sqft" | "sqyd";
const UNIT_DIVISOR: Record<Unit, number> = { sqm: 1, sqft: 10.7639, sqyd: 1.19599 };
const UNIT_LABEL: Record<Unit, string> = { sqm: "₹ / sq.m", sqft: "≈ ₹ / sq.ft", sqyd: "≈ ₹ / sq.yd (વાર)" };

function formatRate(value: number, unit: Unit): string {
  const converted = value / UNIT_DIVISOR[unit];
  const rounded = unit === "sqm" ? converted : Math.round(converted);
  return `${unit === "sqm" ? "" : "≈ "}₹ ${rounded.toLocaleString("en-IN")}`;
}

export default function JantriPage() {
  const meta = VADODARA_META;

  const [villageInput, setVillageInput] = useState("");
  const [picked, setPicked] = useState<VillageHit | null>(null);
  // Suggestions remember which query they answer; the list only renders
  // when that query is still what's typed — no state clearing needed.
  const [suggestions, setSuggestions] = useState<{ q: string; hits: VillageHit[] }>({
    q: "",
    hits: [],
  });
  const [acDismissed, setAcDismissed] = useState(false);
  const [survey, setSurvey] = useState("");
  const [unit, setUnit] = useState<Unit>("sqm");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<JantriSearchResponse | null>(null);
  const acRef = useRef<HTMLDivElement | null>(null);

  const villageQuery = picked ? "" : villageInput.trim();

  // Debounced village autocomplete (fetch only; state lands async).
  useEffect(() => {
    if (villageQuery.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/jantri/villages?district=${meta.slug}&q=${encodeURIComponent(villageQuery)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { villages: VillageHit[] };
        setSuggestions({ q: villageQuery, hits: data.villages });
        setAcDismissed(false);
      } catch {
        // Autocomplete is best-effort; search still works with typed text.
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [villageQuery, meta.slug]);

  const acVisible =
    !picked &&
    !acDismissed &&
    villageQuery.length >= 2 &&
    suggestions.q === villageQuery &&
    suggestions.hits.length > 0;

  // Dismiss the suggestion list on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (acRef.current && !acRef.current.contains(e.target as Node)) setAcDismissed(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  async function runSearch() {
    const village = picked ? picked.village : villageInput.trim();
    if (village.length < 2 || loading) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const params = new URLSearchParams({ district: meta.slug, village });
      if (picked) params.set("taluka", picked.taluka);
      if (survey.trim()) params.set("survey", survey.trim());
      const res = await fetch(`/api/jantri/search?${params.toString()}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Lookup failed (${res.status})`);
      }
      setResponse((await res.json()) as JantriSearchResponse);
    } catch (err) {
      setResponse(null);
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-12">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            Jantri rates · <span lang="gu" className="normal-case">જંત્રી</span> · {meta.name.en} district
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight sm:text-4xl">
            Jantri rate lookup
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Jantri (the Annual Statement of Rates) is the government&apos;s
            minimum land value — stamp duty and registration fees are charged
            on the higher of your deal price or this rate. Enter a village and
            survey/block number to see the ASR-2011 rate and the rate in force
            today.
          </p>

          {/* Search panel */}
          <div className="mt-8 rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="district">District <span lang="gu" className="text-muted-foreground font-normal">· જિલ્લો</span></Label>
                <Input id="district" value={`${meta.name.en} (${meta.name.gu})`} disabled />
                <p className="text-xs text-muted-foreground">
                  Vadodara only for now — more districts are on the way.
                </p>
              </div>
              <div className="hidden sm:block" />
            </div>

            <div className="mt-4 space-y-1.5" ref={acRef}>
              <Label htmlFor="village">
                Village / area <span lang="gu" className="text-muted-foreground font-normal">· ગામ</span>
              </Label>
              <div className="relative">
                <Input
                  id="village"
                  value={villageInput}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Start typing… e.g. AKOTA, CHANSAD, GHELVANT"
                  onChange={(e) => {
                    setVillageInput(e.target.value);
                    setPicked(null);
                  }}
                  onFocus={() => setAcDismissed(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                  }}
                />
                {acVisible ? (
                  <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
                    {suggestions.hits.map((s) => (
                      <button
                        key={`${s.book}|${s.taluka}|${s.village}`}
                        type="button"
                        className="flex w-full items-baseline justify-between gap-3 border-b border-border/60 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent"
                        onClick={() => {
                          setPicked(s);
                          setVillageInput(`${s.village} (${s.taluka})`);
                          document.getElementById("survey")?.focus();
                        }}
                      >
                        <span>
                          <span className="font-medium">{s.village}</span>
                          <span className="ml-2 text-xs text-muted-foreground">Taluka: {s.taluka}</span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
                            s.book === "corp"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground",
                          )}
                        >
                          {s.book === "corp" ? "Corporation" : "NA book"}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Covers {meta.name.en} City / Rural / Padra / Vaghodia (Corporation book) and 1,453
                villages (NA book). {meta.coverageNote.en}
              </p>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="survey">
                Survey / block no. <span lang="gu" className="text-muted-foreground font-normal">· સર્વે / બ્લોક નં.</span>
              </Label>
              <Input
                id="survey"
                value={survey}
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. 1486 · 86/2 · 1674/PAIKI — leave blank to see all zones"
                onChange={(e) => setSurvey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch();
                }}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-lg border border-input p-0.5">
                {(["sqm", "sqft", "sqyd"] as Unit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      unit === u
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {UNIT_LABEL[u]}
                  </button>
                ))}
              </div>
              <Button onClick={runSearch} disabled={loading || (picked ? false : villageInput.trim().length < 2)}>
                <Search className="size-4" />
                {loading ? "Looking up…" : "Find jantri rate"}
              </Button>
            </div>
            {unit !== "sqm" ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Official jantri rates are per sq.m — per {unit === "sqft" ? "sq.ft" : "sq.yd (વાર)"} values
                are approximate conversions for reference only.
              </p>
            ) : null}
          </div>

          {/* Results */}
          <div className="mt-8 space-y-5">
            {error ? (
              <div className="flex items-start gap-2 rounded-lg border border-risk-red/40 bg-risk-red-bg px-4 py-3 text-sm text-risk-red">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            ) : null}

            {searched && !loading && !error && response && response.results.length === 0 ? (
              <div className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                No village matched — pick one from the suggestion list while typing.
              </div>
            ) : null}

            {response?.results.map((result, i) => (
              <ResultCard key={i} result={result} unit={unit} />
            ))}

            {response && response.results.length > 0 ? (
              <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  {response.meta.multiplierNote.en} {response.meta.asOfNote.en}{" "}
                  <span className="whitespace-nowrap">
                    (Facts last verified: {response.meta.factsVerifiedOn}.)
                  </span>
                </span>
              </div>
            ) : null}
          </div>

          {/* Standing notes */}
          <div className="mt-10 space-y-3 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Source:</span> {meta.sourceNote.en}
            </p>
            <p>
              <span className="font-medium text-foreground">Indicative only:</span> this is a
              digitised copy of the printed jantri books, provided to help you find the applicable
              zone quickly. It is not an official rate certificate or a market valuation, and zone
              boundaries can matter as much as the printed numbers. Before relying on a rate for
              stamp duty, registration or any transaction, verify it on{" "}
              <a
                href="https://garvi.gujarat.gov.in/ViewJantri_New.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary underline decoration-border underline-offset-2 hover:decoration-primary"
              >
                the official Garvi jantri lookup
                <ExternalLink className="size-3" />
              </a>{" "}
              or at the sub-registrar office.
            </p>
            <p>
              <span className="font-medium text-foreground">How it&apos;s used:</span> stamp duty
              (currently 4.9%) and the 1% registration fee are computed on the higher of the actual
              consideration or the jantri value of the property.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Result rendering                                                    */
/* ------------------------------------------------------------------ */

function MatchLine({ match }: { match: MatchInfo }) {
  if (match.type === "all") return null;
  if (match.type === "exact") {
    return (
      <p className="border-b border-border bg-risk-green-bg px-4 py-2 text-xs text-foreground">
        Survey/block <span className="font-mono font-semibold">{match.tokens.join(", ")}</span> is
        listed here.
      </p>
    );
  }
  if (match.type === "related") {
    return (
      <p className="border-b border-border bg-secondary/60 px-4 py-2 text-xs text-foreground">
        Related entries listed here:{" "}
        <span className="font-mono font-semibold">{match.tokens.join(", ")}</span>
      </p>
    );
  }
  return (
    <p className="border-b border-border bg-risk-amber-bg px-4 py-2 text-xs text-foreground">
      This survey/block number is not individually listed — the zone covers &ldquo;all other plots
      inside its boundary&rdquo;, so it may fall here. Confirm the zone boundary before relying on
      it.
    </p>
  );
}

function RateTable({ rates, unit, head }: { rates: RateLine[]; unit: Unit; head: string }) {
  if (rates.length === 0) return null;
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-border text-left">
          <th className="px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {head}
          </th>
          <th className="px-4 py-2 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            ASR 2011
          </th>
          <th className="px-4 py-2 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            In force today
          </th>
        </tr>
      </thead>
      <tbody>
        {rates.map((line, i) => (
          <tr key={i} className="border-b border-border/60 last:border-b-0">
            <td className="px-4 py-2">
              {line.label}
              <span lang="gu" className="block text-xs text-muted-foreground">
                {line.labelGu}
              </span>
            </td>
            <td className="whitespace-nowrap px-4 py-2 text-right font-mono tabular-nums text-muted-foreground">
              {formatRate(line.asr2011, unit)}
            </td>
            <td className="whitespace-nowrap px-4 py-2 text-right">
              <span className="font-mono font-semibold tabular-nums text-primary">
                {formatRate(line.current, unit)}
              </span>
              <span className="block font-mono text-[10px] text-muted-foreground">
                ×{line.multiplier}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ResultCard({ result, unit }: { result: JantriResult; unit: Unit }) {
  if (result.kind === "not-listed") {
    return (
      <div className="rounded-lg border border-border bg-card">
        <CardHead
          village={result.village}
          detail={`${result.taluka} · ${result.book === "corp" ? "Corporation book" : "NA (village) book"}`}
        />
        <p className="px-4 py-5 text-center text-sm text-muted-foreground">
          Survey/block {result.survey} is not listed in any zone of this area.
        </p>
      </div>
    );
  }

  if (result.kind === "corp-zone") {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <CardHead
          village={result.village}
          detail={`Zone ${result.zone} · ${result.taluka} · Corporation book`}
        />
        <MatchLine match={result.match} />
        <RateTable rates={result.rates} unit={unit} head="Use type" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <CardHead village={result.village} detail={`${result.taluka} · NA (village) book`} />
      {result.sections.map((section, i) => (
        <div key={i} className="border-b border-border last:border-b-0">
          <MatchLine match={section.match} />
          <p className="border-b border-border/60 px-4 py-1.5 text-xs text-muted-foreground">
            Location class: {section.locationClass}
          </p>
          <RateTable rates={section.rates} unit={unit} head="Use type" />
        </div>
      ))}
      {result.surveyNotListed ? (
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          This survey has no separate NA rate here — the village gamtal rates below apply to
          village-site land.
        </p>
      ) : null}
      {result.gamtal.length > 0 ? (
        <RateTable rates={result.gamtal} unit={unit} head="Gamtal (village site)" />
      ) : null}
    </div>
  );
}

function CardHead({ village, detail }: { village: string; detail: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-3">
      <h2 className="font-serif text-lg font-medium">{village}</h2>
      <p className="font-mono text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

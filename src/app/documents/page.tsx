"use client";

import Link from "next/link";
import { ArrowRight, FileText, FolderOpen, Languages, Printer } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { LangToggle } from "@/components/documents/lang-toggle";
import { useUiLang } from "@/components/documents/use-ui-lang";
import { docTemplates } from "@/lib/doc-filler/registry";
import type { DocCategory, DocTemplate, Lang } from "@/lib/doc-filler/types";
import { CATEGORY_LABELS, ltext } from "@/lib/doc-filler/types";

const CATEGORY_ORDER: DocCategory[] = [
  "lease",
  "sale",
  "authority",
  "declaration",
  "family",
  "other",
];

export default function DocumentsCatalogPage() {
  const [uiLang, setUiLang] = useUiLang();
  const other: Lang = uiLang === "gu" ? "en" : "gu";

  const byCategory = new Map<DocCategory, DocTemplate[]>();
  for (const t of docTemplates) {
    const list = byCategory.get(t.category) ?? [];
    list.push(t);
    byCategory.set(t.category, list);
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pt-14 pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">
                {uiLang === "gu" ? "દસ્તાવેજ ડ્રાફ્ટ · ગુજરાત" : "Document drafts · Gujarat"}
              </p>
              <h1 className="mt-3 max-w-2xl font-serif text-3xl font-medium tracking-tight sm:text-4xl">
                {uiLang === "gu"
                  ? "મિલકતના દસ્તાવેજ — સવાલોના જવાબ આપો, તૈયાર ડ્રાફ્ટ મેળવો"
                  : "Property documents, filled for you"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {uiLang === "gu"
                  ? "દસ્તાવેજ પસંદ કરો, ફોર્મમાં વિગત ભરો — સંપૂર્ણ ગુજરાતી ડ્રાફ્ટ સામે જ તૈયાર થતો જુઓ. પ્રિન્ટ કરો કે Word ફાઈલ ડાઉનલોડ કરો."
                  : "Pick a document and answer a short form — the complete Gujarati draft builds itself as you type. Print it or download it as a Word file."}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Languages className="size-4" />
                <LangToggle value={uiLang} onChange={setUiLang} size="md" />
              </div>
              <Button
                variant="outline"
                size="lg"
                render={
                  <Link href="/documents/library">
                    <FolderOpen />
                    {uiLang === "gu" ? "મારા દસ્તાવેજ" : "My documents"}
                  </Link>
                }
                nativeButton={false}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="size-3.5" />
              {uiLang === "gu"
                ? "ગુજરાત સરકારના મોડેલ ડ્રાફ્ટ આધારિત ફોર્મેટ"
                : "Formats based on Gujarat model drafts"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Printer className="size-3.5" />
              {uiLang === "gu"
                ? "પ્રિન્ટ / PDF / Word (.docx) નિકાસ"
                : "Print / PDF / Word (.docx) export"}
            </span>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          {CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => (
            <div key={category} className="mt-10 first:mt-0">
              <h2 className="font-serif text-xl font-medium">
                {ltext(CATEGORY_LABELS[category], uiLang)}
                <span className="ml-2 text-sm font-normal text-muted-foreground" lang={other}>
                  {ltext(CATEGORY_LABELS[category], other)}
                </span>
              </h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {(byCategory.get(category) ?? []).map((t) => (
                  <Link
                    key={t.slug}
                    href={`/documents/${t.slug}`}
                    className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
                  >
                    <p className="font-serif text-lg font-medium leading-snug" lang={uiLang}>
                      {ltext(t.name, uiLang)}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground" lang={other}>
                      {ltext(t.name, other)}
                    </p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {ltext(t.description, uiLang)}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      {uiLang === "gu" ? "ભરવાનું શરૂ કરો" : "Start filling"}
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-14 rounded-lg border border-border bg-secondary/40 p-5 text-sm leading-relaxed text-muted-foreground">
            {uiLang === "gu" ? (
              <>
                આ ડ્રાફ્ટ ગુજરાતમાં સામાન્ય રીતે વપરાતા ફોર્મેટ અને સરકારી મોડેલ
                ડ્રાફ્ટ પરથી તૈયાર થાય છે. તે કાનૂની સલાહ નથી — સહી કે નોંધણી
                પહેલાં તમારા વકીલ પાસે ડ્રાફ્ટ ચકાસાવો અને સ્ટેમ્પ ડ્યુટી /
                નોંધણી ફી જે-તે સબ રજિસ્ટ્રાર કચેરીએ ખાતરી કરો.
              </>
            ) : (
              <>
                Drafts follow the formats commonly used in Gujarat, including the
                government&apos;s model drafts. They are not legal advice — have an
                advocate review the draft before signing or registration, and
                confirm stamp duty / registration fees with the sub-registrar
                office.
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

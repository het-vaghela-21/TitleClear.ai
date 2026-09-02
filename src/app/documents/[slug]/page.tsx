"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, Download, Eraser, Info, Keyboard, Printer } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { DocForm } from "@/components/documents/doc-form";
import { DocPreview } from "@/components/documents/doc-preview";
import { LangToggle } from "@/components/documents/lang-toggle";
import { useUiLang } from "@/components/documents/use-ui-lang";
import { clearDraft, loadDraft, saveDraft } from "@/lib/doc-filler/draft-store";
import { exportDocx, downloadBlob } from "@/lib/doc-filler/export-docx";
import { getDocTemplate } from "@/lib/doc-filler/registry";
import type { FieldValues, Lang } from "@/lib/doc-filler/types";
import { ltext } from "@/lib/doc-filler/types";
import { initialValues, missingRequired } from "@/lib/doc-filler/values";
import { cn } from "@/lib/utils";

export default function DocumentFillerPage() {
  const params = useParams<{ slug: string }>();
  const maybeTemplate = getDocTemplate(params.slug);
  if (!maybeTemplate) notFound();
  // Re-bind after the never-returning guard so the narrowed type carries
  // into the hook closures below.
  const template = maybeTemplate;

  const [uiLang, setUiLang] = useUiLang();
  const [docLang, setDocLang] = useState<Lang>(template.languages[0]);
  const [values, setValues] = useState<FieldValues>(() => initialValues(template));
  const [assistOn, setAssistOn] = useState(false);
  const [exporting, setExporting] = useState(false);
  const hydrated = useRef(false);

  // Restore the autosaved draft once after mount (localStorage is
  // client-only, same pattern as the report flow's store).
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const draft = loadDraft(template.slug);
    if (draft) {
      // One-time sync with localStorage after mount (client-only store),
      // same pattern as the report flow.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues({ ...initialValues(template), ...draft.values });
      if (template.languages.includes(draft.docLang)) {
        setDocLang(draft.docLang);
      }
    }
  }, [template]);

  // Debounced autosave.
  useEffect(() => {
    if (!hydrated.current) return;
    const timer = setTimeout(() => {
      saveDraft({
        slug: template.slug,
        values,
        docLang,
        updatedAt: new Date().toISOString(),
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [values, docLang, template.slug]);

  const model = template.build(values, docLang);
  const missing = missingRequired(template, values);
  const other: Lang = uiLang === "gu" ? "en" : "gu";

  async function handleDocx() {
    setExporting(true);
    try {
      const blob = await exportDocx(model);
      downloadBlob(blob, `${template.slug}-${docLang}.docx`);
    } finally {
      setExporting(false);
    }
  }

  function handleClear() {
    const message =
      uiLang === "gu"
        ? "બધી ભરેલી વિગત ભૂંસી નાખવી છે?"
        : "Clear everything you have filled in?";
    if (!window.confirm(message)) return;
    clearDraft(template.slug);
    setValues(initialValues(template));
  }

  return (
    <>
      <div className="doc-chrome">
        <SiteHeader />
      </div>
      <main className="flex-1">
        <section className="mx-auto max-w-[88rem] px-6 py-8">
          {/* Toolbar */}
          <div className="doc-chrome">
            <Link
              href="/documents"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              {uiLang === "gu" ? "બધા દસ્તાવેજ" : "All documents"}
            </Link>

            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl font-medium tracking-tight sm:text-3xl" lang={uiLang}>
                  {ltext(template.name, uiLang)}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground" lang={other}>
                  {ltext(template.name, other)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <LangToggle value={uiLang} onChange={setUiLang} labels={{ en: "English UI", gu: "ગુજરાતી UI" }} />
                {template.languages.length > 1 ? (
                  <LangToggle
                    value={docLang}
                    onChange={setDocLang}
                    labels={{
                      en: uiLang === "gu" ? "દસ્તાવેજ: English" : "Doc: English",
                      gu: uiLang === "gu" ? "દસ્તાવેજ: ગુજરાતી" : "Doc: ગુજરાતી",
                    }}
                  />
                ) : null}
              </div>
            </div>

            {template.stampNote ? (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" />
                <p>{ltext(template.stampNote, uiLang)}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            {/* Form column */}
            <div className="doc-chrome min-w-0">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <button
                  type="button"
                  onClick={() => setAssistOn(!assistOn)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                    assistOn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Keyboard className="size-4" />
                  {uiLang === "gu" ? "ગુજરાતી ટાઈપિંગ સહાય" : "Gujarati typing assist"}
                </button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {assistOn
                    ? uiLang === "gu"
                      ? "અંગ્રેજી અક્ષરોમાં લખો — શબ્દ પૂરો થતાં ગુજરાતીમાં ફેરવાશે (Google Input Tools વડે)."
                      : "Type in English letters — words convert to Gujarati as you go (via Google Input Tools)."
                    : uiLang === "gu"
                      ? "ચાલુ કરો એટલે નામ-સરનામાં અંગ્રેજી અક્ષરોમાં લખતાં ગુજરાતીમાં ફેરવાય."
                      : "Turn on to type names & addresses in English letters and get Gujarati script."}
                </p>
              </div>

              <DocForm
                sections={template.sections}
                values={values}
                onChange={setValues}
                uiLang={uiLang}
                assistOn={assistOn}
              />

              <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                <p className="text-xs text-muted-foreground">
                  {uiLang === "gu"
                    ? "વિગત આપોઆપ આ બ્રાઉઝરમાં સચવાય છે."
                    : "Your entries autosave in this browser."}
                </p>
                <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground">
                  <Eraser className="size-3.5" />
                  {uiLang === "gu" ? "બધું ભૂંસો" : "Clear all"}
                </Button>
              </div>
            </div>

            {/* Preview column */}
            <div className="min-w-0">
              <div className="doc-chrome mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {missing > 0
                    ? uiLang === "gu"
                      ? `${missing} જરૂરી વિગત બાકી — ખાલી જગ્યા ____ તરીકે દેખાશે`
                      : `${missing} required detail${missing === 1 ? "" : "s"} left — blanks show as ____`
                    : uiLang === "gu"
                      ? "બધી જરૂરી વિગત ભરાઈ ગઈ છે"
                      : "All required details filled"}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="size-3.5" />
                    {uiLang === "gu" ? "પ્રિન્ટ / PDF" : "Print / PDF"}
                  </Button>
                  <Button size="sm" onClick={handleDocx} disabled={exporting}>
                    <Download className="size-3.5" />
                    {exporting ? "…" : "Word (.docx)"}
                  </Button>
                </div>
              </div>

              <div className="doc-preview-pane lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto rounded-lg bg-muted/60 p-4 sm:p-6">
                <DocPreview model={model} />
              </div>

              <p className="doc-chrome mt-4 text-xs leading-relaxed text-muted-foreground">
                {uiLang === "gu"
                  ? "આ ડ્રાફ્ટ સામાન્ય ફોર્મેટ મુજબ છે અને કાનૂની સલાહ નથી. સહી / નોંધણી પહેલાં વકીલ પાસે ચકાસાવો."
                  : "This draft follows the customary format and is not legal advice. Have an advocate review it before signing or registration."}
              </p>
            </div>
          </div>
        </section>
      </main>
      <div className="doc-chrome">
        <SiteFooter />
      </div>
    </>
  );
}

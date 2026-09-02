# Document filler (દસ્તાવેજ ડ્રાફ્ટ)

Auto-fills Gujarat property/legal documents: the user picks a document,
answers a bilingual form, and the complete Gujarati (and where offered,
English) draft builds itself live — ready to print, save as PDF (via the
print dialog) or download as an editable Word file.

Lives entirely beside the title-check product: routes under
`/documents`, library under `src/lib/doc-filler/`, components under
`src/components/documents/`. Nothing in the report flow was touched.

## Why these formats

The Gujarat registration department publishes official **model drafts**
(મોડેલ ડ્રાફ્ટ) on the Garvi portal — the same formats sub-registrar
offices distribute. We mirrored those; the extracted verbatim texts live in
`research/templates/*.txt` (downloaded from vakilsaheb.org, which re-hosts
the Garvi .doc files) and each template file notes which source it encodes.
Competitor research (eDrafter, LegalDesk, NoBroker, eSahayak, Gujdoc…) is
summarized in `research/` too; the wizard + live-preview UX follows the
pattern that works (LegalDesk-style), and Gujarati-language generation is
the gap almost nobody fills.

## Architecture — three layers, all swappable

1. **Template definition** (`templates/*.ts`, registered in `registry.ts`)
   — a form schema (`sections`) plus `build(values, lang)` that returns a
   `DocumentModel`. Templates never touch React or HTML.
2. **Document model** (`types.ts`) — renderer-agnostic blocks: `title`,
   `para` (runs with bold/underline), `clause`, `schedule` (label/value
   table), `signatures`, `witnesses`, `stamp-space`, `spacer`.
3. **Renderers** — consume the same model:
   - HTML preview: `src/components/documents/doc-preview.tsx` (also the
     print layout — `documents.css` hides everything marked `.doc-chrome`
     when printing);
   - Word export: `export-docx.ts` (browser-side, dynamic `docx` import,
     A4 with wide left binding margin, Shruti font for Gujarati).

Supporting pieces:

- `gujarati.ts` — Gujarati numerals, number→words in the Indian system
  (`રૂ. ૫,૫૦,૦૦૦/- (અંકે રૂપિયા પાંચ લાખ પચાસ હજાર પૂરા)`), dates
  (`તા. ૧૮મી ઓગસ્ટ, ૨૦૨૬ ને સોમવાર`), `ઉ.વ.આ.` age phrases.
- `build.ts` — `makeCtx(values, lang)` gives templates typed accessors
  with blank-filling (`____` for empty fields, so a half-filled preview
  still reads like a deed form), plus terse block constructors.
- `shared-fields.ts` — party groups (name/age/occupation/address +
  Aadhaar/PAN/mobile as on the model drafts), witness group, property
  schedule (village/taluka/district, survey, khata, આકાર, boundaries) and
  `partyLine()` which renders the model-draft party introduction.
- `values.ts` — initial values (min group entries), required-field count.
- `draft-store.ts` — localStorage autosave per template slug.

UI:

- `/documents` — bilingual catalog grouped by category.
- `/documents/[slug]` — form left, live preview right; UI-language toggle
  (EN/ગુજરાતી labels — both always visible, toggle switches primacy),
  document-language toggle where a template offers both, print and .docx
  actions, autosave, clear.
- Gujarati typing assist (`gujarati-field.tsx` + `/api/documents/
  transliterate` proxying Google Input Tools): OFF by default, per-field
  toggle; with it on, Latin-typed words convert to Gujarati script at word
  boundaries. If the service is unreachable the text stays as typed.
- Gujarati fonts (Noto Serif/Sans Gujarati) load only in this section's
  layout (`src/app/documents/layout.tsx`).

## Adding a document

1. Create `templates/<slug>.ts` exporting a `DocTemplate` — copy the
   closest existing one; reuse `partyGroup`, `propertySection`,
   `witnessGroup` where they fit.
2. List it in `registry.ts`.

That's all — catalog, filler, preview, print and .docx pick it up.

## Current catalog (8)

| Slug | Document | Languages | Source |
|---|---|---|---|
| `bhada-karar` | ભાડા કરાર (leave & licence) | gu, en | model draft + customary 11-month format |
| `banakhat` | બાનાખત, with/without possession | gu, en | model drafts (both variants) |
| `vechan-dastavej` | વેચાણ દસ્તાવેજ (agri / NA plot / building) | gu, en | model drafts (4 variants folded into one) |
| `bakshis-dastavej` | બક્ષિસ દસ્તાવેજ (gift deed) | gu, en | model draft |
| `release-lekh` | રીલીઝ લેખ / હક કમી (અવેજી-બિનઅવેજી) | gu | model drafts (both variants) |
| `vasiyatnamu` | વીલ યાને વસિયતનામું | gu, en | model draft |
| `kulmukhtyarnamu` | સામાન્ય કુલમુખત્યારનામું (sale power opt-in) | gu, en | model drafts (કબજા વગર base) |
| `sogandnamu` | સોગંદનામું (affidavit) | gu, en | official affidavit frame |

Each template carries a `stampNote` (informational stamp-duty/registration
guidance, always phrased "verify current rates" — the 2025 stamp amendment
changed several articles).

## Deliberate limitations

- Drafts, not legal advice — the UI says so on every screen; the 32(A)
  photo/thumb annexure and 34(3) checklist that registered deeds need are
  referenced in a note, not generated (they're filled at the sub-registrar
  office).
- Sale-deed valuation uses the user-entered consideration; jantri lookup
  and stamp-duty calculators are a later workstream.
- Samvat (સંવત) date line of the model drafts is simplified to the English
  date; add a `samvat` field later if document writers ask for it.
- Transliteration calls Google's public Input Tools endpoint through our
  proxy — swap `TRANSLITERATE` provider in the route handler if needed.

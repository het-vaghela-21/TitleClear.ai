# TitleClear.ai — Tech Guide

A short reference for how the codebase is put together. Pairs with
`PROJECT_CONTEXT.md` (the product brief). This covers the frontend-only
phase — no real backend or database exists yet.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **shadcn/ui** (on Base UI) for form controls, buttons, cards, etc.
- No backend, no real database. All data is generated on the client from
  a small set of canned scenarios and passed between pages via
  `sessionStorage`.

## Data model ("schema")

There's no real database yet, but the shape of one lives in
`src/lib/types.ts` — this is what a future backend/DB would mirror.

| Type | Fields | Notes |
|---|---|---|
| **Property** | `id, state, areaKind, district, taluka/village` (rural) or `ward/citySurveyArea` (urban), `surveyNo, khataNo, ownerNameRef, landType, createdAt` | What the user submits in the plot form. `state` is a code (`"GJ"`), never hardcoded, so other states can be added later. |
| **Owner** | `id, propertyId, name, ownershipStart, ownershipEnd, transactionType, documentRef` | One row per link in the ownership chain. `ownershipEnd: null` = current owner. |
| **RecordItem** | `id, propertyId, source, label, status, retrievedAt, note` | One row per document/check. `source` is one of the six source keys below. `status` is `found \| missing \| pending`. |
| **Flag** | `id, propertyId, category, severity, title, description, recommendedNextStep` | `severity` is `low \| medium \| high`. |
| **Report** | `id, propertyId, titleClearScore, band, generatedAt, status, summary` | `band` is `green \| amber \| red`, derived from the score. |

A `ReportBundle` is just `{ property, report, owners, records, flags }` —
everything a report page needs in one object.

The six **sources** (`RecordSourceKey`) are fixed: `land_records`,
`registration`, `rera`, `tax`, `court`, `map`. Defined once in
`src/lib/connectors/types.ts` so labels stay consistent everywhere.

## Data pipeline (mock, today)

There's no server round-trip — everything happens in the browser:

```
/check (form)
   │  user fills plot details, submits
   ▼
buildProperty() → sessionStorage["titleclear:property:<id>"]
   │  router.push
   ▼
/report/[id]/assembling
   │  runs the 6 mock connectors (src/lib/connectors/mock-connectors.ts)
   │  each resolves after a random delay, driving the checklist UI
   │  once all resolve → buildReportBundle(property)
   ▼
sessionStorage["titleclear:report:<id>"]
   │  router.push
   ▼
/report/[id]
   │  reads the bundle from sessionStorage and renders it
```

Key files:

- **`src/lib/mock/scenarios.ts`** — three canned outcomes (`clear`,
  `caution`, `risk`), each a full set of owners/records/flags/score. This
  is the "fake data source."
- **`src/lib/mock/seed.ts`** — hashes the property's district/taluka/
  village/survey/khata into a number, used to deterministically pick one
  of the three scenarios. Same plot details always produce the same
  report.
- **`src/lib/connectors/mock-connectors.ts`** — one connector per source,
  each implementing `SourceConnector` (`src/lib/connectors/types.ts`).
  They just filter the chosen scenario's records down to their own
  source and resolve after a delay — this is what makes the assembling
  screen feel like six independent lookups instead of one fake timer.
- **`src/lib/mock/build-report.ts`** — assembles the final `ReportBundle`
  (assigns ids, timestamps) once all connectors have resolved.
- **`src/lib/property-store.ts`** — the only place that touches
  `sessionStorage`. Two things live there: the submitted `Property` and
  the generated `ReportBundle`, both keyed by property id.

### Swapping in a real backend later

The `SourceConnector` interface is the seam: a real connector implements
the same `fetchRecords(property)` signature but calls an actual
government portal/API instead of filtering a scenario. Nothing in the UI
(`assembling`/`report` pages) needs to change — they only know about the
interface, not the mock implementation. Same idea for storage:
`property-store.ts`'s two functions (`saveProperty`/`loadProperty`,
`saveReportBundle`/`loadReportBundle`) are the seam to swap
`sessionStorage` for real API calls once there's a backend.

## State configuration

`src/lib/states/types.ts` defines a `StateConfig` shape (districts,
talukas, field labels). `src/lib/states/gujarat.ts` is the only
implementation today. Adding a second state means adding another file
matching that shape and registering it in `stateConfigs` — the form and
report pages never hardcode "Gujarat."

## Risk/score presentation

`src/lib/risk.ts` centralizes all the green/amber/red logic — score → band
mapping, band/severity/status → color classes and labels, date
formatting. Anywhere a risk color shows up in the UI, it reads from here,
so the palette stays consistent and easy to change in one place.

## Folder map

```
src/
  app/                     routes (landing, /check, /report/[id](/assembling), /login)
  components/              SiteHeader, SiteFooter, TitleSeal, shadcn/ui primitives
  lib/
    types.ts                data model
    risk.ts                 score/severity → color + label helpers
    property-store.ts       sessionStorage read/write (the "DB" for now)
    states/                 per-state form config (Gujarat today)
    connectors/             SourceConnector interface + mock implementations
    mock/                   scenarios, seeding, report assembly
```

## What's intentionally not built

Per `PROJECT_CONTEXT.md`: no live government scraping, no captcha
handling, no real scoring engine, no payments, no advocate workflow.
Everything above exists so those can be dropped in later behind the same
interfaces without touching the UI.

## OCR module (synthetic-only, Python-free by design)

`src/lib/ocr/` is a real, provider-abstracted OCR + field-extraction
pipeline (mirrors the `SourceConnector` pattern), but tested only against
synthetic Gujarati+English documents per the trial exception in
`PROJECT_CONTEXT.md` — no real documents, no portal access, not wired into
the report UI. Written in TypeScript rather than Python (the repo has no
Python entry point, same reasoning as `scripts/gujrera-cli.ts`). See
`src/lib/ocr/README.md`.

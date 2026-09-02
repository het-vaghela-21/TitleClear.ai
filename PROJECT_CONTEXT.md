# TitleClear.ai — Project Context

## What this is
TitleClear.ai is a property title due-diligence platform. A user enters basic
plot details for a property in Gujarat, and the platform assembles the
relevant government records (land records, registration, RERA, tax, court
cases) into one report that flags risks and gives a "Title Clear Score."

It does **not** replace a lawyer. Software does the data-gathering and
cross-checking; a human advocate reviews and signs off on the premium tier.
The app should always read as an assistive due-diligence tool, not a legal
certificate.

**Initial scope:** Gujarat only. Other states come later, so the design
should keep "state" as a variable, not hardcode Gujarat everywhere.

## Current phase: Setup + Frontend only
Right now I'm only building **setup and frontend** — enough to demo to my
mentor. Please do **not** build or wire up any of the following yet:
- Live scraping/automation of any government portal
- Captcha handling of any kind
- Real OCR pipelines
- Real risk-scoring logic

Those are separate, later workstreams (some depend on legal sign-off).
For now, all data in the UI should come from **mock/dummy data** so the
screens and flows can be demoed and iterated on independently.

## The user flow to build
1. **Landing page** — explains what the product does, simple and trustworthy
   tone (this deals with legal/financial anxiety — think clean, credible,
   not flashy).
2. **Plot input form** — user enters:
   - District, Taluka, Village (rural) *or* Ward/City Survey area (urban)
   - Survey number / FP number / Khata number
   - Optional: owner name (for reference only, not required)
3. **"Assembling report" / progress state** — mock a short progress view
   showing the sources being checked (Land Records, Registration/EC, RERA,
   Tax, Courts, Map) — this can be a static/simulated sequence for now.
4. **Report page** — the core deliverable screen:
   - Property summary (land type, area, khata, survey no.)
   - Ownership timeline (chart/list of past owners with dates)
   - Document checklist (found / missing, e.g. 7/12, sale deed, EC)
   - Encumbrance / mortgage status
   - Tax status
   - RERA status (if applicable)
   - Overall **Title Clear Score** (0–100) with color coding:
     green = low risk, amber = medium, red = high
   - List of flagged issues, each with a short plain-language explanation
   - "Next steps" section (e.g. "Get sale deed of 2020 transaction",
     "Consult lawyer regarding pending case")
   - Clear disclaimer: *this is a preliminary check, not a legal title
     certificate*
5. **Login / account** — basic auth scaffold, can be simple for now.

## Data model (rough shape, to scaffold with mock data)
- **Property**: id, state, district, taluka, village/ward, survey_no,
  khata_no, land_type (agri/non-agri), area, source_state
- **Owner**: id, name, property_id, ownership_start_date, ownership_end_date
- **Record**: id, property_id, source (land_records / registration / rera /
  tax / court / map), status (found/missing/pending), retrieved_at
- **Flag/Issue**: id, property_id, category, severity (low/med/high),
  description, recommended_next_step
- **Report**: id, property_id, title_clear_score, generated_at, status

## Design tone
- Clean, credible, calm — this is a trust product dealing with people's
  biggest purchase. Avoid anything that feels like a generic SaaS template.
- Colour-coded risk (green/amber/red) should be used consistently and
  sparingly — it's the product's key signal, don't dilute it elsewhere.
- Keep Gujarati + English in mind for future localization, even if English-
  only for now (avoid hardcoding text in a way that blocks translation later).

## Out of scope for this phase (do not build yet)
- Any connector to a real government portal, **except** the GujRERA trial
  connector below
- Captcha-handling of any kind
- OCR on real documents — see the synthetic-only exception below
- Actual risk-rule engine (use static/mock scoring for the demo)
- Payment/billing flows
- Advocate review workflow (comes after core report UI is solid)

## Trial exception: OCR workstream (synthetic-only)
As of 2026-08-10, building the OCR module (`src/lib/ocr/`) is in scope,
provider-abstracted and tested against synthetic dummy documents only:
- Two real OCR providers behind a common interface (local Tesseract,
  cloud Google Vision, the latter feature-flagged behind
  `GOOGLE_VISION_API_KEY`), plus stubs for future providers.
- A second-stage LLM field extractor, also behind a swappable interface.
- A generator for synthetic Gujarati+English RoR/Index-2-style documents
  and a harness that scores the pipeline against them (CER, field
  accuracy).
- **No real documents, no government portal access** — this stays
  synthetic-only until reviewed. Not wired into the mock report/assembling
  UI. See `src/lib/ocr/README.md` for details and scope notes.

## Active workstream: Document filler (દસ્તાવેજ ડ્રાફ્ટ) — added 2026-08-18
Per the plan change of 2026-08-18, the current build focus is a **document
auto-filler**: Gujarat property documents (banakhat, sale deed, rent
agreement, POA, affidavit, gift deed, release deed, will) are generated
from a form — user answers questions, the complete Gujarati/English draft
builds itself live, printable and downloadable as .docx.

- Lives in its own section: routes `/documents` and `/documents/[slug]`,
  library `src/lib/doc-filler/`, components `src/components/documents/`.
  The title-check product is untouched and stays as-is.
- Formats are encoded from the Gujarat registration department's official
  model drafts (Garvi portal); verbatim source texts and competitor
  research live in `research/`.
- Bilingual by design (LText everywhere, Gujarati-first documents), with
  optional Gujarati typing assist (Google Input Tools via our
  `/api/documents/transliterate` proxy — off by default).
- See `src/lib/doc-filler/README.md` for architecture and how to add a
  document type.
- Out of scope for now: e-stamp procurement, Aadhaar eSign, stamp-duty
  calculators, payment flows (competitor table stakes for later;
  researched in `research/`).

## Active workstream: Accounts — added 2026-09-01
Real login, so uploaded documents belong to someone. Replaces the login
page's UI-only scaffold.

- Library `src/lib/auth/`, routes `src/app/api/auth/{signup,login,logout,me}`,
  route guard `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`).
- Email + password. scrypt hashing from node's own crypto, sessions as
  server-side records keyed by an opaque 256-bit cookie id, so logout
  actually revokes. No auth library, no database, no secret to configure.
- Accounts and sessions live under `storage/auth/` beside the documents.
- **Only the document library requires an account.** Title check, jantri and
  the document drafter all still work signed out — the login page says so,
  and `PROJECT_CONTEXT`'s "continue without an account" flow is intact.
- `proxy.ts` only checks that a session cookie exists; every API route
  re-checks it properly with `currentUser()`. The proxy is a redirect, not
  the security boundary.
- Gaps, listed in `src/lib/auth/README.md`: no email verification, no
  password reset, in-memory (per-process) login throttle, no roles.

## Active workstream: Document library — added 2026-08-31
`/documents/library` lets the user upload their **own** property papers —
PDFs, Word files, scans, anything — and read them back in the browser.
Companion to the document filler: that generates drafts, this keeps the
papers you already have.

- Library `src/lib/doc-library/`, routes `src/app/api/documents/library/`,
  pages `/documents/library` and `/documents/library/[id]`.
- Files land in `storage/documents/<ownerId>/` (gitignored, override the
  root with `STORAGE_DIR`) as `<uuid>.<ext>` plus a `<uuid>.meta.json`
  sidecar. A plain directory on purpose — swapping in object storage later
  touches only `store.ts`.
- Viewers: PDF and images natively, `.docx` converted with `mammoth` and
  shown in a `sandbox=""` iframe, text as-is. Everything else downloads.
- Uploaded files are treated as hostile: content type comes from a
  sanitized extension against an inline allow-list, everything else is
  forced to an octet-stream attachment. See the security section of
  `src/lib/doc-library/README.md`.
- Requires an account (below). Not yet linked to a property or report —
  that is a follow-up.

## Active workstream: Jantri rate lookup — added 2026-08-20
`/jantri` looks up government jantri (ASR) land rates for Vadodara
district (mentor-requested; more districts later). Dataset digitised from
the official ASR-2011 books (source demo in `research/jantri/`), served
via server-side API routes; current rates derived per-category using the
GR of 13-04-2023 multipliers (land ×2, flat ×1.8, office ×1.5, shop ×2 —
NOT a flat ×2). The revised "Jantri 2.0" is pending with the state; when
notified, `src/lib/jantri/meta.ts` is the switch point. See
`JANTRI_ARCHITECTURE.md`.

## Trial exception: GujRERA connector
As of 2026-08-06, a read-only trial connector against the public GujRERA
2.0 project-search portal (gujrera.gujarat.gov.in) is in scope, on these
terms:
- Public, no-login project/promoter/agent search only.
- Single lookups, not bulk crawling. Polite rate limits, caching, backoff.
- If a captcha, login wall, or bot-detection is hit, stop — do not solve
  or work around it. Surface a "needs manual handling" error instead.
- Behind a feature flag (`RERA_CONNECTOR_ENABLED`), off by default.
- Document links (title report, EC) are captured as metadata only — the
  documents themselves are not downloaded in this trial.
- All other real-connector work (land records, registration, tax, court,
  map) remains out of scope until this trial is reviewed.

## Tech notes
- Keep source connectors behind a common interface even in mock form, so
  real connectors can be swapped in later without changing the UI layer.
- Keep "state" (Gujarat) as configuration, not hardcoded, since more states
  are planned later.

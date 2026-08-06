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
- Any connector to a real government portal
- Captcha-handling of any kind
- OCR on real documents
- Actual risk-rule engine (use static/mock scoring for the demo)
- Payment/billing flows
- Advocate review workflow (comes after core report UI is solid)

## Tech notes
- Keep source connectors behind a common interface even in mock form, so
  real connectors can be swapped in later without changing the UI layer.
- Keep "state" (Gujarat) as configuration, not hardcoded, since more states
  are planned later.

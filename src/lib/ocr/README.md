# OCR module

**Scope note:** per `PROJECT_CONTEXT.md`, real OCR is otherwise out of scope
for this phase. This module is an explicitly-approved exception, scoped to
**synthetic data only** — no real documents, no government portal access.
See the "OCR workstream (synthetic-only)" section there for the terms.

Extracts text + structured fields (owner name, survey no, area, dates, doc
type…) from Gujarati + English property documents, mirroring the
`SourceConnector` provider-abstraction pattern used in
`src/lib/connectors/`.

## Architecture

- **`types.ts`** — `OCRProvider` interface (`extract(imagePath, langs) ->
  OCRResult`) and `FieldExtractor` interface (`OCRResult -> ExtractedFields`
  matching the `Owner`/`Property` schema in `src/lib/types.ts`).
- **`providers/`** — `TesseractProvider` (local, offline, real — via
  `tesseract.js`), `GoogleVisionProvider` (cloud, real, feature-flagged
  behind `GOOGLE_VISION_API_KEY`), `SuryaProvider`/`VLMProvider` (stubs).
  `VLMProvider` targets **Qwen2.5-VL** specifically — see "Handwritten
  Gujarati: provider research" below for why. Selected via `OCR_PROVIDER`
  env or `getOcrProvider(id)` (`registry.ts`).
- **`extractor/llm-providers/`** — `MockLLMFieldExtractor` (default,
  deterministic regex-based, offline) and `AnthropicFieldExtractor` (real,
  feature-flagged behind `ANTHROPIC_API_KEY`). Selected via
  `FIELD_EXTRACTOR_PROVIDER` env or `getFieldExtractor(id)`.
- **`synthetic/`** — `generate.ts` renders RoR/Index-2-style documents
  mixing Gujarati (Noto Sans Gujarati) and English (Noto Sans) text via
  `@napi-rs/canvas`, and writes ground-truth field JSON next to each image.
- **`harness/`** — `run-harness.ts` runs the pipeline over a fixture set and
  reports character error rate (per script) and field-level accuracy.

## Usage

```bash
npm run ocr:generate-fixtures -- src/lib/ocr/fixtures/synthetic 8
npm run ocr -- --image src/lib/ocr/fixtures/synthetic/synthetic-000.png --provider tesseract
npm run ocr:harness -- src/lib/ocr/fixtures/synthetic tesseract
npm run test:ocr
```

`--provider google` requires `GOOGLE_VISION_API_KEY`; without it (and
without `OCR_PROVIDER` set) the registry defaults to `tesseract` so the
pipeline always runs offline.

## What's real vs. stubbed

- **Real**: `TesseractProvider` (actually runs OCR via WASM Tesseract),
  `GoogleVisionProvider` (real REST call, but needs a key — never exercised
  by tests), `MockLLMFieldExtractor` (real regex extraction, just not an
  LLM), `AnthropicFieldExtractor` (real Claude call, needs a key), the
  synthetic generator and harness (fully real, no stubs).
- **Stubbed**: `SuryaProvider`, `VLMProvider` — throw
  `NotImplementedProviderError`, left as documented seams per the brief.

## Handwritten Gujarati: provider research

Handwriting is the hard case for this pipeline — clear handwritten
Gujarati tops out around 55-70% accuracy even with dedicated research
models, vs. 95%+ for printed text. Findings from evaluating open-source
options against that specifically (2026-08):

- **PaddleOCR — ruled out.** Confirmed against PaddleOCR's own supported-
  language table (including the latest PP-OCRv5 multilingual release,
  100+ languages): Gujarati is not in it, not even under the
  Devanagari-script grouping (which only covers Hindi, Marathi, Nepali,
  Sanskrit, Bhojpuri, etc. — a different script). Adding it as a provider
  here would silently produce garbage on Gujarati text, so it's
  intentionally not integrated.
- **Qwen2.5-VL — best realistic option.** Not a dedicated OCR engine but a
  vision-language model; general-purpose VLMs currently outperform
  segmentation-based OCR engines on messy/handwritten multilingual text,
  and Qwen2.5-VL specifically benchmarks SOTA on multilingual + handwriting
  OCR tasks (OCRBench, OmniDocBench). This is what `VLMProvider` targets —
  see that file for the three hosting options and what's left to wire up.
- **Surya** — genuinely supports a broad script list and runs fully local,
  but its Gujarati-specifically accuracy is unverified, and it's a Python
  package, so making it real means a local inference sidecar (subprocess or
  small HTTP service) behind `SuryaProvider`.
- **IIT Bombay's `indic-trocr`** (Apache-2.0, TrOCR architecture, built
  for handwritten Indian-language docs) — promising lineage, but its
  published language list (Hindi, Tamil, Malayalam, Bengali, ...) doesn't
  include Gujarati out of the box. Using it would mean fine-tuning on a
  Gujarati handwriting dataset (e.g. IIIT-HW-style) — a research/training
  task, not a provider-integration one.
- **Google Vision** (already implemented, see above) — real handwriting
  support via `DOCUMENT_TEXT_DETECTION`, supports Gujarati, just needs
  `GOOGLE_VISION_API_KEY`. Currently the best *already-working* option in
  this repo for handwritten Gujarati.

## Known limitations

- `TesseractProvider` downloads `eng.traineddata`/`guj.traineddata` from
  tesseract.js's default CDN on first use unless `TESSERACT_LANG_PATH`
  points at a local cache — set it for fully offline/deterministic CI runs.
- The harness's per-language CER (`harness/metrics.ts`) filters recognized
  and reference text down to one Unicode script and diffs those
  subsequences — a cheap proxy, not true script-aware alignment. Good
  enough to catch "Gujarati recognition regressed" but not a citable metric.
- `MockLLMFieldExtractor` is a regex extractor pattern-matched to the
  synthetic templates' own label text — it is not representative of how a
  real LLM would perform on messy real-world OCR output.

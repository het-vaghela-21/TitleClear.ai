# Jantri lookup — architecture

`/jantri` lets a user find the government jantri (Annual Statement of
Rates) for a plot in Vadodara district: type a village, optionally a
survey/block number, and get the applicable value-zone or village rates —
the printed ASR-2011 figure and the rate in force today. Built to expand
district-by-district.

## Where the data comes from

The mentor-supplied demo (`research/jantri/vadodara-jantri-demo.html`)
embeds a digitisation of the two official ASR-2011 (Final) jantri books
for Vadodara district:

- **Corporation/Authority book** — 1,350 value zones across 97 areas of
  Vadodara City, Vadodara Rural, Padra and Vaghodia; each zone lists the
  survey/block tokens it covers and 7 rates (open plot residential, flat,
  office, shop, open plot industrial, agri piyat, agri bin-piyat).
- **NA (village) book** — 1,453 villages across the 12 talukas of the
  *undivided* district (ASR-2011 predates the 2013 Chhota Udepur split),
  each with survey rows grouped by location class and 4 NA rates, plus
  gamtal (village-site) residential/commercial rates.

`scripts/extract-jantri.mjs` parses the demo, **validates the shape**
(category counts, rate types, survey tokens, fallback flags) and writes
`src/lib/jantri/vadodara/{corp,na}.json` (~1.4 MB). Re-running it against
a fresh source file is the whole data pipeline.

## The correctness layer (deliberate deviation from the demo)

The demo displayed "latest = 2011 × 2" for every category. That is not
what the law says. Per **Revenue Dept GR No. STP-122023-20-H.1 dated
13-04-2023** (in force 15-04-2023):

- **land rates** (open plots, agri, NA land, mineral, gamtal): **× 2**
- **composite rates**: residence flat **× 1.8**, office **× 1.5**,
  shop **× 2**

So multipliers live **per rate category** in `src/lib/jantri/meta.ts`,
next to the bilingual labels — the data files store only the printed 2011
figures, never derived values. The same file carries the user-facing
notes: the GR provenance, the "revised jantri (drafted 20-11-2024) is
pending, not in force" status, and `factsVerifiedOn` (2026-08-20, the
date we last checked official sources — Garvi still serves ASR-2011 with
the doubling notice). **If Jantri 2.0 is notified, `meta.ts` is the only
file to change** (or, if the new rates are per-plot, a new dataset drops
in beside the old one).

## Layers

```
src/lib/jantri/
  types.ts        result/data models shared by server and client
  match.ts        survey-token matcher (pure; ported 1:1 from the demo)
  meta.ts         rate categories + multipliers, bilingual labels, notes
  registry.ts     district registry, lazy fs-loaded data, indexes, lookup
  vadodara/       corp.json + na.json (extracted, server-only)
  jantri.test.ts  matcher semantics pinned by tests (npm run test:jantri)

src/app/api/jantri/
  villages/route.ts   GET ?district&q      → autocomplete hits
  search/route.ts     GET ?district&village[&taluka][&survey] → result cards

src/app/jantri/
  layout.tsx      loads Noto Sans Gujarati for this route only
  page.tsx        client UI: autocomplete, survey input, unit toggle, cards
```

**The dataset never reaches the browser.** `registry.ts` is guarded with
`server-only`, reads the JSON lazily from disk (so neither the bundler nor
the type-checker processes 1.4 MB), and caches data + per-district indexes
(`Map` by `taluka|village`) in module scope. The client fetches the two
routes and renders typed result cards; a search response is a few KB.

## Matching semantics (`match.ts`)

Survey books are messy, so the matcher distinguishes:

- **exact** — token equals the query, or a printed range token
  ("12 TO 45") contains the numeric query;
- **related** — the book lists subdivisions of the queried base
  ("1674/PAIKI", "240/P", "86/2" for "1674"/"240"/"86") or vice versa;
- **fallback** — nothing listed, but a zone flagged `f:1` covers "all
  other plots inside its boundary" → shown with an amber caveat, since we
  did not digitise zone-boundary maps;
- prefix similarity alone ("864" vs "86") is **never** a match.

These rules are pinned in `jantri.test.ts`.

## UI decisions

- Results show **both** columns — printed ASR-2011 and "in force today" —
  with the applied factor (×2 / ×1.8 / ×1.5) under each derived value, so
  nothing looks like magic.
- Official rates are ₹/sq.m; a unit toggle offers ≈ ₹/sq.ft and
  ≈ ₹/sq.yd (વાર) conversions, explicitly marked approximate.
- A village existing in both books (e.g. CHANSAD) returns both cards —
  same behaviour as the demo.
- Standing disclaimers on the page: digitised copy, not an official rate
  certificate; zone boundaries matter; verify on the official Garvi
  lookup (deep link) or at the sub-registrar office; stamp duty (4.9%) and
  registration fee (1%) are charged on the higher of consideration or
  jantri value.

## Adding a district

1. Produce `corp.json` / `na.json` in the same shape (reuse or adapt
   `scripts/extract-jantri.mjs`; the validator is the contract).
2. Add a `JantriDistrictMeta` and one entry in `districtDefs` in
   `registry.ts`.
3. Surface it in the page's district selector.

## Known limitations

- Zone **boundaries** are not digitised — fallback matches are labelled
  "may fall here", never asserted.
- Construction (bandhkam) rates and paid-FSI premiums are out of scope.
- The pending revised jantri can obsolete these numbers overnight — the
  UI says so and points at Garvi.

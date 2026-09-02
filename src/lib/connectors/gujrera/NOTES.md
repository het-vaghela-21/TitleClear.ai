# GujRERA connector — trial notes

Investigated 2026-08-06 against `https://gujrera.gujarat.gov.in` (GujRERA 2.0
public portal). This is a **read-only trial**, feature-flagged off by
default (`RERA_CONNECTOR_ENABLED`). See `PROJECT_CONTEXT.md`'s "Trial
exception: GujRERA connector" section for the scope this was approved
under.

## Access method

**No captcha, no login wall, no bot-detection encountered anywhere in this
investigation.** The portal is an Angular SPA (hash routing, `#/...`) with
public JSON endpoints behind project/promoter/agent search, exactly as
advertised ("Public Search (No Login)"). We call those JSON endpoints
directly — we never drive the Angular UI itself.

- **`robots.txt`**: returns HTTP 404 (doesn't exist). No `Disallow` rules
  to respect, but that's an absence of guidance, not a grant — the polite-
  client constraints below still apply.
- **Terms & Conditions** (`#/website-guide/terms-condition`): standard
  government-site disclaimer (accuracy not guaranteed, use for legal
  purposes at your own risk, Indian law governs, links to outside sites
  aren't endorsed). **No clause prohibiting automated/programmatic
  access** was found in the Terms & Conditions or the linked policy pages
  (Disclaimer, Hyperlinking Policy, Privacy Policy).
- **Search mechanism**: a documented (if unofficial) JSON API, reverse-
  engineered from the Angular bundle rather than published anywhere. We
  prefer this over HTML scraping per the trial's own instructions.

### Endpoints used

| Purpose | Method | Path | Notes |
|---|---|---|---|
| Search by name/promoter/reg no | POST | `/project_reg/public/global-search` | Body: `{ query, startWith, dataSize }`. `query` is a free-text match against project/promoter/agent names and reg numbers. `startWith`/`dataSize` page (defaults `0`/`25`). |
| Promoter + registration summary | GET | `/project_reg/public/alldatabyprojectid/{entityId}` | Promoter name/contact, `projRegNo`, `approvedDate` (registration date), registration certificate doc UID. |
| Project status/dates/address | GET | `/project_reg/public/getproject-details/{entityId}` | `data.projectDetail`: `projectStatus`, `startDate`, `completionDate`, district, address. |
| Disclosed documents | GET | `/project_reg/public/getproject-doc/{entityId}` | `data.projectdoc` (**not** `data.findoc` — see pitfall below) holds title report / title clearance / encumbrance certificate doc IDs and UIDs. |
| Document metadata | GET | `/vdms/getDocMetadata/{uid}` | Filename, MIME type, page count, upload date. **Not** the file itself. |
| Document download (never called) | GET | `/vdms/download/{uid}` | We only ever construct this URL as a link; the connector does not fetch it. |

**Pitfall worth flagging**: `getproject-doc` returns *two* sibling objects
under `data` — `findoc` (financial statements: balance sheet, P&L, cash
flow) and `projectdoc` (title report / title clearance / EC). They're easy
to confuse; the disclosure documents we care about are in `projectdoc`.
The first draft of this connector read `findoc` and silently got `undefined`
for every document link — caught by cross-checking against a second live
capture before shipping.

### How we found the API (for future maintainers)

The site is a lazy-loaded Angular app; the search UI only appears after
`main-es2015.*.js` plus a couple of feature chunks load. We:
1. Opened the site in a real browser and watched Network requests while
   typing a search — found the `POST .../global-search` call.
2. Downloaded the relevant JS chunks and grepped the minified source for
   the calling code to learn the exact request body shape (`{query,
   startWith, dataSize}`) and default values (`dataSize: 25`, `startWith: 0`).
3. Called the endpoint directly via `fetch()` from the browser console
   (same-origin, no CORS issues) to see the real response shape, rather
   than guessing field names from the minified templates.
4. For the project-detail page: the SPA doesn't put the target id in the
   URL — it stashes it in `sessionStorage.publicProjectRegId` and routes to
   `#/project-preview`. We replicated that (`sessionStorage.setItem` + one
   navigation) to load exactly one project's detail page.

### Important side-effect discovered: don't render the search-results UI

Driving the actual Angular results page (typing into the search box and
clicking search) fires the `global-search` call **and then ~100+ follow-up
requests** — a `getDocMetadata` + `download` pair for the thumbnail image
of every single result row, even ones you never look at. For a query
matching ~190 entities that's ~190+ extra HTTP calls the moment the results
render.

**This connector never renders that page.** It calls the JSON endpoints
directly via `fetch`, which returns just the data with no image fan-out.
This is the main reason to prefer the direct-API approach here over
browser automation of the public search page — it's not just faster, it's
the only way to stay inside "single lookups, no bulk crawling."

## A non-captcha blocker we did stop on first

The very first live CLI run failed immediately with
`ERR_SSL_UNSAFE_LEGACY_RENEGOTIATION_DISABLED` — every request errored
before a single byte of response came back. This looked serious enough to
stop and diagnose rather than assume: is it a bot-detection layer politely
disguised as a TLS failure?

It isn't. `gujrera.gujarat.gov.in`'s server-side TLS stack expects legacy
renegotiation, which Node 22's bundled OpenSSL 3.x refuses by default as a
security hardening measure. Browsers connect fine because browser/OS TLS
stacks are more lenient here — this is a client-library default, not
something the server does differently for bots vs. browsers. Confirmed by
retrying the identical request with `secureOptions:
SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION` set on the TLS connection (via an
`undici.Agent` passed as `fetch`'s `dispatcher`) — it succeeded immediately,
same response either way a browser would get. This is a standard, narrowly-
scoped Node/OpenSSL interoperability setting for old server TLS configs,
unrelated to auth, captcha, or bot-detection, so it's applied in
`client.ts`. If a *real* block (401/403, HTML login page, captcha mention)
ever shows up, `assertNotBlocked()` still throws `ManualHandlingRequiredError`
before any data is parsed — that path remains untouched.

## Fields we can reliably extract

Per normalized record (`NormalizedRegistryRecord`, in
`../registry.ts`):

- `projectName`, `promoterName`, `reraRegNo` — reliable for PROJECT
  matches (backed by `alldatabyprojectid`).
- `registrationStatus` — reliable (`getproject-details.projectDetail.projectStatus`,
  e.g. `"New"`). We haven't seen the full enum of possible values (only
  observed `"New"` in this trial) — treat other values as opaque strings,
  don't assume a fixed set.
- `district`, `projectType`, `address` — reliable.
- `registrationDate` — reliable, sourced from `approvedDate` (format
  `DD-MM-YYYY`, converted to ISO).
- `completionDate` — reliable, sourced from `getproject-details` (already
  ISO).
- `documents[]` — reliable when disclosed: registration certificate,
  title report, title clearance certificate, encumbrance certificate.
  **Not every project discloses every document** — fields can be
  genuinely absent (`null`/`undefined`), not just slow to load. Treat a
  missing document as "not disclosed," not as a fetch failure.
- Search results for **PROMOTER/AGENT/other** entity types are returned
  as basic normalized records only (name, district, contact) — we did
  **not** investigate their detail endpoints in this trial, so no
  enrichment (registration history, associated projects, documents)
  happens for them yet. Known limitation, not a bug.

## Known limitations

- Promoter/agent detail enrichment isn't implemented (see above).
- `registrationStatus`'s full value set is unconfirmed — only "New" was
  observed. Don't build risk-scoring logic on top of it without checking
  more samples first (and risk-scoring is out of scope for this phase
  regardless, per `PROJECT_CONTEXT.md`).
- The API is unofficial/reverse-engineered — GujRERA could change these
  endpoints or response shapes without notice. There's no published
  contract to depend on.
- Verified live end-to-end via the CLI against the same real project used
  in the fixtures: `title_clearance_certificate` and
  `encumbrance_certificate` came back pointing at the same underlying PDF
  (same `fileName`, different `documentId`/UID). That's the promoter
  having uploaded one combined "title clearance cum encumbrance"
  certificate to both disclosure slots — normal in practice, not a bug in
  this connector. Don't assume the two are always distinct files.
- `global-search`'s `query` is a loose free-text match — for common words
  it can return unrelated promoters/projects/agents that happen to share
  a substring. Callers should treat multiple results as "candidates," not
  assume the first one is correct.
- This connector is **not** wired into the mock report/assembling UI.
  That stays out of scope until this trial is reviewed (see
  `PROJECT_CONTEXT.md`) — right now it's reachable only via the CLI
  (`npm run gujrera`) and `GET /api/rera/search`.
- No captcha/login/bot-detection was hit, so `ManualHandlingRequiredError`
  is currently unexercised against the real site — it's a guard for
  responses that don't look like JSON or come back 401/403, not something
  we've observed happening yet.

## Politeness measures implemented (`client.ts`)

- Descriptive `User-Agent` identifying this as a research/trial bot.
- All requests funnel through a single queue with a minimum 2.5s gap
  between real network calls (concurrent callers still only hit the server
  one at a time, spaced out).
- Exponential backoff (1s, 2s, 4s + jitter) on transient failures, up to
  3 retries. `ManualHandlingRequiredError` is never retried — it always
  propagates immediately.
- Local JSON cache (`__cache__/`, gitignored) keyed by request URL+body,
  12h TTL, so repeated runs during development don't re-hit the server.
- A single project lookup makes at most ~7 requests (search + 3 detail
  calls + up to 3 document-metadata calls), capped to the top 5 project
  matches per query — never the full result set.

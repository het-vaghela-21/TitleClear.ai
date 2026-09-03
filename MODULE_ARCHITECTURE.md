# TitleClear — Module Architecture

**Purpose of this document:** to define how TitleClear is split into independent
parts, so that changing one thing (a law, a rate, a language, a state, a model)
does not break the others.

---

## 1. The problem we are designing for

TitleClear sits on top of rules that keep moving:

- **Laws and rules change.** Stamp duty rates, required documents, and what counts
  as a red flag are revised by the government regularly. Users must be able to
  change these themselves, without a developer and without a new release.
- **We will add more states.** Gujarat today. Maharashtra, Rajasthan and others
  later. Each state has different documents, different words for the same thing,
  and different rules.
- **We will add more languages.** English and Gujarati today. Hindi, Marathi and
  others later.
- **The AI will keep improving.** Better models arrive every few months and we
  should be able to swap them in without rewriting the product.

If everything is written in one place, every one of these changes is a risk. So we
split the system into modules with clear walls between them.

---

## 2. The single rule that makes this work

> **Modules never reach inside each other. They only pass agreed data shapes
> between them.**

Think of it like a factory line. Each station is handed a tray, does its one job,
and passes the tray on. A station can be replaced with a better one overnight — as
long as the new station accepts the same tray and returns the same tray.

In our system the "tray" is a fixed list of fields: owner name, survey number,
village, area, dates, document type, and so on. That list is Module 5 below.

Two practical consequences:

- We can replace the OCR engine without touching the rules.
- We can let a user write a hundred new rules without touching the AI.

---

## 3. Module map

We have **8 modules**: the **4 engines** that do the work, and **4 supporting
modules** that keep those 4 engines independent of each other.

```
+----------------------------------------------------------------------+
|  8  APP SHELL                                                        |
|     screens, login, file uploads, the report the customer reads      |
+---------------------------------+------------------------------------+
                                  |
+---------------------------------v------------------------------------+
|  1  FLOW ENGINE                                                      |
|     decides what runs and in what order, saves progress,             |
|     handles failures and retries                                     |
|     intake -> read -> understand -> check -> score -> report         |
+---------+--------------+---------------+-----------------+-----------+
          |              |               |                 |
+---------v------+ +-----v--------+ +----v---------+ +-----v----------+
|  3  OCR        | |  4  ML       | |  2  RULES    | |  7 CONNECTORS  |
|     ENGINE     | |     ENGINE   | |     ENGINE   | |                |
|                | |              | |              | |                |
|  picture       | |  text        | |  facts       | |  outside data  |
|    -> text     | |    -> facts  | |    -> risk   | |    -> facts    |
+---------+------+ +-----+--------+ +----+---------+ +-----+----------+
          |              |               |                 |
+---------v--------------v---------------v-----------------v-----------+
|  5  SHARED DATA CONTRACTS   the common language all modules speak    |
|  6  STATE PACKS             one rulebook folder per state            |
+----------------------------------------------------------------------+
```

**Why 4 supporting modules and not just the 4 engines:**

- The 4 engines still need a **common language** to talk in, or they end up
  reaching into each other again — that is Module 5.
- State-specific facts (documents, labels, rates, rules) would otherwise get
  scattered across all 4 engines — that is Module 6.
- Fetching data from government portals is a different kind of work with different
  failure modes (sites go down, captchas appear) and must not be tangled into the
  pipeline — that is Module 7.
- Screens and login are not engine work and change for completely different
  reasons — that is Module 8.

---

# The 4 Engines

---

## Module 1 — Flow Engine

*The manager. It does no real work itself; it decides who works, in what order.*

### What it does

- Runs a verification from start to finish as a fixed sequence of steps.
- Passes the output of each step as the input of the next.
- Saves the state after every single step, so a crash never loses a whole run.
- Reports live progress to the user ("reading document 3 of 7").
- Handles failure honestly: if one step fails it records which step, why, and what
  the user can do about it — it does not fail the whole run silently.
- Lets steps be added, removed or reordered without any step knowing about it.

### What it covers

- The step sequence: **intake → read → understand → classify → cross-check →
  score → assemble report.**
- Turning uploaded files into readable pages (PDF pages into images, Word files
  into text).
- Run records: what was uploaded, what each step produced, how long it took, what
  failed.
- Restarting a stalled or failed run.
- Which engine and rulebook version were used for a run, so an old report can
  always be explained.

### Why we need it

- Today the process has 7 steps. Tomorrow it may have 10 — a fraud check, a
  map-boundary check, an advocate review step. Without a manager, adding a step
  means editing every other step.
- Verification takes minutes, not seconds. Something must track progress, survive
  restarts, and let the user return to a half-finished run.
- It is the only module that knows the *order* of things. Everyone else just does
  their one job. That is what keeps the other modules replaceable.

### Boundary — what it must NOT do

- It must not know Gujarati. It must not know what a 7/12 extract is. It must not
  know that a missing NA order is bad. The moment the flow engine contains a fact
  about land law, the design has failed.

---

## Module 2 — Rules Engine

*The rulebook. This is the module our users will actually customise.*

### What it does

- Holds every rule that decides whether something about a property is fine,
  questionable, or a problem.
- Runs those rules against the facts gathered from the documents.
- Produces three things: **flags** (real problems), **review items** (uncertain,
  needs a human look), and a **score** out of 100.
- Explains every result in plain language, plus what the user should do next.
- Lets a non-developer create, edit, switch off and test rules through a screen —
  not by editing code.

### What it covers

**a) Rules as filled-in forms, not code.** Every rule has the same shape:

| Part of the rule | Example |
|---|---|
| What it looks at | Survey number on the 7/12 vs on the sale deed |
| The condition | They do not match |
| How serious | High |
| Which category | Consistency |
| Points lost | 20 |
| What we tell the user | "The survey number differs between two documents." |
| What to do next | "Get the mismatch corrected before proceeding." |

Because a rule is a form and not a program, a user cannot write a rule that
crashes the system.

**b) Rulebooks with dates.** Rules are grouped into a **rulebook** that belongs to
one state and has a start date. When a law changes on 1 April, we publish a new
rulebook version starting 1 April. Old reports keep the rulebook they were scored
with, so re-opening a year-old report shows the same result it showed then.

**c) A safe editing loop.** Draft → run it against sample cases → see exactly what
changes → publish. A user always sees the effect of a rule before it goes live,
and can roll back.

**d) The score policy as data.** Category weights, penalty points and thresholds
sit in one place as plain numbers. Recalibrating the score never means touching
logic.

**e) The rule catalogue.** Missing documents, mismatched details, broken ownership
chain, mortgage or loan signs, tax dues, court cases, poor scan quality.

### Why we need it

- **This is the part that changes most often.** Rules change with every government
  circular. If a rule change needs a developer and a release, the product is
  permanently out of date.
- Each state has a different rulebook. Separating rules from everything else is
  what makes adding a state a data job rather than a rewrite.
- A regulator, a lawyer or a mentor will ask *"why did this property score 62?"*
  Because rules are data with plain-language text attached, we can print the exact
  list of rules that fired and the points each one took away.

### The safety mechanism (important)

A user-written rule can only ask about fields that Module 5 guarantees exist. The
rule editor offers a dropdown of available fields — not a free text box. So a user
can write a *wrong* rule, but never a *broken* one. This is the single most
important guard rail in the whole design.

### Boundary — what it must NOT do

- It must never read a file, call an AI model, or fetch a web page. It receives
  facts and returns judgements. Nothing else.

---

## Module 3 — OCR Engine

*The reader. Turns a picture of a document into text.*

### What it does

- Takes an image or a scanned page and returns the text on it, plus a confidence
  figure for how sure it is.
- Supports several reading engines behind one common interface, chosen by
  configuration — not by changing code.
- Supports several languages as **plug-in language packs**.
- Reports honestly when it is unsure, so a bad scan becomes "needs a human look"
  rather than confident nonsense.
- Measures its own accuracy against a set of test documents, so we can prove a new
  engine is actually better before switching to it.

### What it covers

- **Engines:** a local offline engine (Tesseract — works with no internet and no
  API key), a cloud engine (Google Vision — much better on real scans and
  handwriting), and prepared slots for future engines including vision AI models.
- **Language packs:** English and Gujarati today. A new language means adding a
  pack — its script, its trained data, and how confident we are in it. Nothing
  outside this module changes.
- **Quality measurement:** a generator that creates realistic sample documents
  with known correct answers, and a scorer that reports character error rate and
  field accuracy per language.
- **The hard case, handwriting.** Handwritten Gujarati is genuinely difficult —
  roughly 55–70% accuracy at best, against 95%+ for printed text. This module owns
  that problem and is where the research into better handwriting models is kept.

### Why we need it

- Adding a language must never be a product-wide change. Adding Marathi should
  touch this module and one state pack — nothing else.
- OCR quality is the single biggest driver of whether the final report is any
  good. It deserves its own accuracy tests, separate from everything else.
- The best OCR technology in this space changes every few months. We must be able
  to swap engines with no risk to the rest of the product.

### Boundary — what it must NOT do

- It must not try to understand what the text means. It returns text and a
  confidence number. Deciding that "1234/2" is a survey number is Module 4's job.

---

## Module 4 — ML Engine

*The interpreter. Turns loose text into organised facts.*

### What it does

- Reads the raw text from Module 3 and pulls out the fields we care about: owner
  name, survey number, village, district, area, khata number, dates, document
  type, mortgage mentions.
- Decides what type of document each upload actually is, and whether that matches
  what the user said it was.
- Compares the same field across several documents and decides whether they agree —
  allowing for spelling variants, Gujarati vs English spellings, different date
  formats and different area units.
- Gives a confidence level with every fact, so uncertain results go to human review
  instead of being treated as truth.

### What it covers

- **Field extraction:** a rule-based extractor that works offline, and an AI-based
  extractor (Claude) that handles messy real-world text. Selected by configuration.
- **Document classification:** deciding whether an upload really is a 7/12 extract,
  an Index-2, a sale deed, and so on.
- **Matching and reconciliation:** the hardest and most valuable part. Deciding
  that "રમેશભાઈ પટેલ", "Rameshbhai Patel" and "R. Patel" are the same person — or
  that they are not.
- **Normalisation:** converting units (guntha, hectare, square metre), date formats
  and name spellings into one comparable form.
- **An honest vocabulary:** every comparison returns one of four answers —
  **match**, **related**, **mismatch** or **missing**. "Related" means close but
  not identical, and it becomes a review item, never an accusation. This is what
  stops the product from confidently telling a customer their title is defective
  because of a spelling difference.
- **Future scope:** fraud pattern detection, ownership-chain reconstruction,
  learning from advocate corrections.

### Why we need it

- This is where AI belongs, and it must be contained. If AI calls were sprinkled
  through the pipeline and the rules, we could never test, price or replace them.
- It is the part most likely to be replaced by something better. Isolating it means
  a model upgrade is a configuration change, not a project.
- It is also the part most likely to be *wrong*. Keeping it behind one wall means
  there is exactly one place where confidence is judged and uncertainty is handled.

### Boundary — what it must NOT do

- It must not decide whether something is *bad*. Finding that two survey numbers
  differ is Module 4's job. Deciding that this is a high-severity problem worth 20
  points is Module 2's job.

---

# The 4 Supporting Modules

---

## Module 5 — Shared Data Contracts

*The dictionary. The common language every module speaks.*

### What it does

- Defines, in one place, the exact shape of every piece of information that moves
  between modules.
- Defines the document type list — every kind of land document we recognise, with
  its Gujarati and English names.
- Defines the vocabulary for results: severity levels, match verdicts, score bands,
  category names.
- Ensures every user-visible piece of text carries both a Gujarati and an English
  version, so nothing gets stuck in one language.

### What it covers

- Property, Owner, Document, Extracted Fields, Flag, Review Item, Score, Report.
- The document type list, and which fields each type is expected to contain.
- The bilingual text format used everywhere.

### Why we need it

- This is the actual mechanism that makes the modules independent. Modules do not
  depend on each other — they all depend on this one small, slow-changing
  dictionary.
- It is what makes the rules engine safe to open up to users: the rule editor can
  only offer fields that exist here.
- It is deliberately the **smallest and most stable** module. If it changes weekly,
  the design is wrong.

---

## Module 6 — State Packs

*One folder per state. Everything Gujarat-specific lives inside it.*

### What it does

- Bundles everything that is true about one state into a single self-contained
  package, so adding a state means adding a folder.

### What it covers

For each state, one pack containing:

- **Form settings** — district and taluka lists, and the local words for things
  ("Taluka" in Gujarat, "Tehsil" elsewhere; "Khata" vs "Patta").
- **Document requirements** — which documents are needed for which land type
  (agricultural, non-agricultural, urban plot, flat) and which are optional.
- **The default rulebook** — the state's starting set of rules, which users then
  customise.
- **Local terms** — the words that appear on that state's documents, in that
  state's language, used by the classifier and the matcher.
- **Rates and reference data** — jantri / ASR land rates, stamp duty, and the
  government notification each number came from, with the date it took effect.
- **Which languages to read** — Gujarat means Gujarati + English; Maharashtra would
  mean Marathi + English.

### Why we need it

- Today "Gujarat" is spread across the form config, the requirements table, the
  document keywords, the rate data and the scoring policy. Adding a second state in
  that shape means editing five places and hoping nothing breaks.
- With state packs, adding Maharashtra is: create a folder, fill in the same shape,
  register it. The 4 engines are not touched, not rebuilt, not retested.
- It also gives a clean answer to "where did this number come from?" — every rate
  and requirement carries its source notification and effective date.

---

## Module 7 — Connectors

*The outside world. Fetching data we do not have.*

### What it does

- Fetches records from external sources behind one common interface, so the rest of
  the system does not care whether data came from a live portal, a cached copy or a
  stub.
- Handles the messy realities of external systems: rate limits, retries, caching,
  outages.
- Stops cleanly and says "this needs manual handling" when it hits a captcha or a
  login wall, rather than trying to work around it.

### What it covers

- Sources: land records, registration and encumbrance, RERA, property tax, court
  cases, maps. GujRERA is live today — read-only public search, behind a feature
  flag — and the rest are stubs behind the same interface.
- Caching and polite request pacing.
- Turning each source's own format into the shared shapes from Module 5.

### Why we need it

- Government portals are unreliable and change without notice. That instability
  must be contained in one module and never leak into the pipeline.
- Every source has its own legal and access constraints. Keeping them separate lets
  each be switched on or off independently as approvals come through.
- The rest of the system already works against these interfaces using mock data, so
  a real connector can be switched on with no other change.

---

## Module 8 — App Shell

*Everything the customer sees and touches.*

### What it does

- Provides the screens: property entry, document upload, live progress, final
  report.
- Handles accounts and login, so uploaded documents belong to someone.
- Stores uploaded files safely and serves them back for viewing.
- Presents the report: score, flagged issues, ownership timeline, document
  checklist, next steps, and the disclaimer that this is a preliminary check and
  not a legal title certificate.

### What it covers

- All screens, in both Gujarati and English.
- Sign-up, login, sessions, and the rule that documents are private to their owner.
- File storage — currently a plain folder structure, so moving to cloud storage
  later changes one file.
- Report rendering and download.

### Why we need it

- Screens change for completely different reasons than engines do — design
  feedback, not law changes. Mixing the two means every design tweak risks the
  scoring logic.
- Uploaded documents are people's private legal papers. Ownership and access
  control need to live in one clearly identified place.
- Keeping presentation separate means the same engines can later serve a mobile
  app, a partner API or a bulk tool with no engine changes.

---

## 4. How a change flows through the system

This table is the real test of the design. For each kind of change, only the named
module should need editing.

| When this changes | We edit | We do NOT touch |
|---|---|---|
| A penalty weight or score threshold | Rules Engine (numbers) | Everything else |
| A new required document in Gujarat | Gujarat State Pack | All 4 engines |
| A new rule, written by a user | Rules Engine (via the editor) | All code |
| A stamp duty / jantri rate revision | Gujarat State Pack | All 4 engines |
| Support Marathi documents | OCR Engine (new language pack) | Rules, ML, Flow |
| A better handwriting model appears | OCR Engine (new engine option) | Everything else |
| A better field-extraction AI appears | ML Engine (swap the extractor) | Everything else |
| Add Maharashtra | New State Pack + its connectors | All 4 engines |
| Add a new step, e.g. a fraud check | Flow Engine + one new step | Existing steps |
| A government portal becomes available | Connectors (one new connector) | Everything else |
| Redesign the report screen | App Shell | All 4 engines |
| Add a brand-new fact we extract | Contracts, then ML, then Rules | OCR, Flow, Connectors |

The last row is the only change that crosses several modules — because adding a new
*kind of fact* genuinely changes the shared language. That is expected and rare, and
it is the reason Module 5 is kept deliberately small.

---

## 5. Where we are today

| Module | Status |
|---|---|
| 1 Flow Engine | **Built.** Seven steps, progress saved after each one, restart on stall, tested end to end. |
| 2 Rules Engine | **Half built.** Rules run and score correctly, and the numbers are already separated out as data. **Not yet user-editable** — no editor screen, no rulebook versions, no effective dates. This is the biggest remaining gap. |
| 3 OCR Engine | **Built.** Two working engines behind one interface, two languages, plus a sample-document generator and an accuracy scorer. Handwriting is the known weak point. |
| 4 ML Engine | **Built, but scattered.** Extraction, classification and matching all work and are each individually swappable, but they currently live in two different folders. They should sit in one module. |
| 5 Contracts | **Built.** Shared shapes, document taxonomy and bilingual text are all in place. |
| 6 State Packs | **Exists, but scattered.** All the Gujarat detail is written as data rather than hardcoded, which is right — but it sits in five places instead of one pack. Consolidating it is the prerequisite for adding a second state. |
| 7 Connectors | **Interface built, one real connector.** GujRERA works; the rest are mocks behind the same interface. |
| 8 App Shell | **Built.** Screens, login, document library, report rendering. |

### The three things to do next, in order

1. **Consolidate the Gujarat state pack** into one folder. Cheap to do now,
   expensive to do once a second state exists.
2. **Group the ML engine** into one module so extraction, classification and
   matching sit together.
3. **Make rules user-editable** — rulebook storage, versions with effective dates,
   an editing screen, and test-before-publish. This is the feature that makes the
   whole product customisable, and it is what the rest of the architecture was
   arranged to support.

---

## 6. Two other features that reuse the same foundations

These are separate product areas, not part of the verification pipeline, but they
sit on the same contracts and the same state packs:

- **Jantri rate lookup** — government land rate lookup by area and category. Feeds
  the state packs' rate data, and can later feed valuation rules.
- **Document drafter** — generates Gujarat property document drafts (banakhat, sale
  deed, rent agreement, power of attorney and others) from a form. Uses the same
  bilingual text format and the same document type list.

---

## 7. Summary

**8 modules. 4 engines and 4 supports.**

| # | Module | One line |
|---|---|---|
| 1 | Flow Engine | Runs the steps in order and never loses a run |
| 2 | Rules Engine | Holds the rules users can change, and produces the score |
| 3 | OCR Engine | Turns pictures into text, one plug-in per language |
| 4 | ML Engine | Turns text into organised, comparable facts |
| 5 | Contracts | The common language that keeps the modules apart |
| 6 | State Packs | One folder per state, holding everything local |
| 7 | Connectors | Fetches outside data without destabilising the pipeline |
| 8 | App Shell | Screens, accounts, storage and the report |

The design goal in one sentence: **a law changes, and we edit one file in one state
pack — and nothing else in the system needs to be retested.**

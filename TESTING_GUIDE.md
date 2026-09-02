# Testing guide — Document filler (દસ્તાવેજ ડ્રાફ્ટ)

How to manually verify the document auto-filler feature end to end.
Everything here runs locally with mock-free, real behavior — no env vars or
API keys needed (the only external call is the optional Gujarati typing
assist, which proxies Google Input Tools).

## 0. Start the app

```bash
npm run dev
```

Open **http://localhost:3000/documents** (or click **Documents** in the
site header from the home page).

---

## 1. Catalog page (`/documents`)

What to check:

1. Documents appear grouped by category — Rent & lease, Sale & transfer,
   Power of attorney, Affidavits & declarations, Family & inheritance.
2. Every card shows the name in two languages (e.g. **બાનાખત (વેચાણ કરાર)**
   with *Agreement to sell (Banakhat)* under it).
3. Click the **ગુજરાતી / English** toggle (top right): the whole page's
   headings, descriptions and buttons switch language. The other language
   stays visible as a secondary hint.
4. Reload the page — the language choice is remembered (localStorage).

## 2. Core flow — Rent agreement (the simplest full document)

Open **ભાડા કરાર (લીવ એન્ડ લાયસન્સ) / Rent agreement**.

### 2a. Live preview fills as you type

1. The right side shows the complete Gujarati agreement with `________`
   blanks wherever a field is empty. The counter above it says how many
   required details are left.
2. Pick an **Agreement date** → the preview's opening line becomes e.g.
   `આજરોજ તા. ૧૮મી ઓગસ્ટ, ૨૦૨૬ ને મંગળવાર…` (Gujarati numerals + weekday,
   computed).
3. Type a landlord name and watch it appear in the party block *and* in
   the signature block at the bottom.

### 2b. Money in words (deed convention)

1. Enter **Monthly rent** = `12000` → under the input you see the amount
   in words, and the preview's rent clause reads
   `રૂ. ૧૨,૦૦૦/- (અંકે રૂપિયા બાર હજાર પૂરા)` — Indian digit grouping,
   Gujarati numerals, Gujarati words.
2. Try `550000` deposit → `રૂ. ૫,૫૦,૦૦૦/- (અંકે રૂપિયા પાંચ લાખ પચાસ
   હજાર પૂરા)`.

### 2c. Gujarati typing assist (transliteration)

1. Click **Gujarati typing assist / ગુજરાતી ટાઈપિંગ સહાય** at the top of
   the form (it's OFF by default — it sends each typed word to Google's
   transliteration service, so it's opt-in).
2. In **Place**, type `amdavad` and press space → it becomes **અમદાવાદ**.
   Type `ramesh patel` in a name field → **રમેશ પટેલ**.
3. Every Gujarati-script field has a small **ગુ** button inside it — click
   it to turn assist on/off for that one field. With assist off you can
   paste or type Gujarati directly, or leave values in English.
4. Kill your network and type a word + space — the Latin text simply stays
   as typed (graceful fallback, no error).

### 2d. Repeating parties and witnesses

1. In Landlord details click **Add landlord** → a second party card
   appears; the preview now shows **મકાનમાલિક ૧:** and **મકાનમાલિક ૨:**
   and two signature slots.
2. Remove it with the trash icon (the button only appears above the
   minimum count — witnesses can't go below 2).

### 2e. Document language toggle

1. Use the **Doc: ગુજરાતી / Doc: English** toggle → the generated document
   switches to the full English leave-and-licence text; the same field
   values flow in ("Rs. 12,000/- (Rupees twelve thousand only)").
2. Note the **UI language** toggle and the **document language** toggle
   are independent — Gujarati UI with English document works, and
   vice versa.

### 2f. Select-driven clauses

Change **Use** to ધંધાકીય/Commercial → the purpose recital and use clause
in the preview change wording accordingly.

### 2g. Autosave, reload, clear

1. Fill a few fields, wait a second, reload the page → everything is still
   there (localStorage draft, per document).
2. **Clear all** asks for confirmation, then resets the form and deletes
   the draft.

### 2h. Print / PDF

1. Click **Print / PDF**. In the print preview you should see *only* the
   document — no site header, form, buttons or footer.
2. Page 1 keeps a blank area at the top (space reserved for the e-stamp /
   franking — the dashed border and hint text do not print, only the gap).
3. Margins: A4 with a wider left margin (binding side). Choose "Save as
   PDF" as the printer to get the PDF.

### 2i. Word (.docx) download

1. Click **Word (.docx)** → downloads `bhada-karar-gu.docx`.
2. Open in MS Word / LibreOffice: Gujarati text renders (Shruti font),
   the schedule is a real table, signature lines and witness rows are
   there, and everything is editable — this is the "take it to your
   advocate / document writer" output.

## 3. Banakhat — variant switching + computed balance

Open **બાનાખત (વેચાણ કરાર)**.

1. The preview title reads **કબજા વગરનો વેચાણ કરાર યાને બાનાખત** and
   clause (૪) says possession is *not* handed over. Switch **Possession
   handed over now?** to હા/Yes → title becomes **કબજા સાથેનો…** and
   clause (૪) now records possession delivered today. (These mirror the
   two official model drafts.)
2. Enter **Total consideration** `5500000` and **Earnest** `500000` →
   clause (૩) automatically shows the balance **રૂ. ૫૦,૦૦,૦૦૦/-** in
   figures *and* Gujarati words (total − earnest, computed).
3. Pick **Earnest paid by** = Cheque and type a cheque number → clause (૨)
   reads `…ચેકથી (નં. 123456) અમો લખી આપનારે લીધા છે…`.
4. Compare with the source it was encoded from:
   `research/templates/banakhat_kabja_vagar.txt` — the opening
   `જત અમો લખી આપનાર તમો લખી લેનારને…`, the forfeiture clause and the
   free-will closing match the government model draft.

## 4. Sale deed — land-type variants

Open **વેચાણ દસ્તાવેજ (સેલ ડીડ)**.

1. **Type of property** = ખેતીલાયક જમીન/Agricultural → a **ખેડૂત ખાતેદાર**
   clause appears (buyer must be an agriculturist; fill the detail field
   under "Land-specific details" and it's woven into the sentence).
2. Switch to **NA open plot** → the khedut clause disappears; fill **NA
   permission order** and an NA-permission line appears instead.
3. Fill the property section (village, survey no, khata, આકાર, boundaries)
   → the **પરિશિષ્ટ** schedule table in the preview fills row by row;
   empty optional rows (khata, આકાર, TP/FP) stay hidden until filled.

## 5. Will — heavy repeating groups

Open **વીલ યાને વસિયતનામું**.

1. Add 2–3 relatives, 2 immovable properties, a couple of movable items
   and 2 beneficiaries → the preview builds numbered schedules
   (સ્થાવર મિલકત ૧, ૨…) and per-beneficiary bequest clauses (૬.૧, ૬.૨…).
2. Note the stamp note: a will needs **no stamp paper** — different from
   every other document (each document's note is specific to it).

## 6. Affidavit — numbered statements

Open **સોગંદનામું**. Each statement you add becomes a numbered paragraph;
the closing verification includes the "ખોટું સોગંદનામું કરવું તે ફોજદારી
ગુનો બને છે…" line from the official format.

## 7. Edge cases worth poking

1. **Unknown document** → http://localhost:3000/documents/foo shows the
   404 page.
2. **Empty print** — print with nothing filled: the document prints as a
   blank fill-in form (all `________`), which is itself a valid use.
3. **Transliteration API directly**:
   `http://localhost:3000/api/documents/transliterate?text=ramesh` →
   `{"suggestions":["રમેશ",…]}`; empty/over-long text → `{"suggestions":[]}`.
4. **Responsive**: narrow the window — the preview stacks below the form;
   on desktop it's a sticky, independently-scrolling right column.
5. **Existing app untouched**: `/`, `/check`, the assembling screen and
   `/report/[id]` all still work exactly as before; "Documents" is just a
   new header link.

## 8. Jantri rate lookup (`/jantri`)

1. Open **Jantri rates** from the header. Type `chansad` in Village —
   suggestions show **CHANSAD (PADRA)** twice: a Corporation-book entry
   and an NA-book entry. Pick the Corporation one, enter survey `1486`,
   search.
   - Expected: zone **86/0/1** card with "Survey/block 1486 is listed
     here", plus the NA-book card for the same village. Open plot
     ₹3,650 → ₹7,300 (×2); residence flat ₹8,700 → ₹15,660 (**×1.8**);
     office ₹9,750 → ₹14,625 (**×1.5**) — multipliers per the GR of
     13-04-2023, shown under each value.
2. Search the same village with survey `999999` — every card turns amber:
   "not individually listed — the zone covers all other plots inside its
   boundary", which is the honest fallback (zone maps aren't digitised).
3. Try an NA-only village: `ghelvant` (CHHOTA UDAIPUR taluka — the books
   cover the undivided district). Expected: location-class sections plus
   Gamtal rates.
4. Leave survey blank — all zones of the village are shown.
5. Flip the unit toggle to ≈ ₹/sq.ft or ≈ ₹/sq.yd — converted values are
   marked approximate; ₹/sq.m is the official unit.
6. API sanity: `/api/jantri/villages?district=vadodara&q=akot` and
   `/api/jantri/search?district=vadodara&village=CHANSAD&survey=1486`;
   unknown district → 404.

## What NOT to expect (deliberate, for now)

- No e-stamp purchase, Aadhaar eSign, or stamp-duty calculator — the
  stamp notes are informational and say "verify current rates".
- The 32(A) photo/thumb annexure and 34(3) checklist of registered deeds
  are referenced in a note, not generated (they're completed at the
  sub-registrar office).
- Generated drafts are **drafts** — every screen carries the
  "have an advocate review before signing/registration" disclaimer.

## If something looks off

- Gujarati shows as boxes → the Noto Gujarati fonts load per-section from
  Google via `next/font`; make sure the first build ran with network
  access.
- Typing assist does nothing → it's off by default; enable the top toggle
  or the per-field **ગુ** button. It needs internet (Google Input Tools).
- Stale form values → that's the autosave draft; use **Clear all**.

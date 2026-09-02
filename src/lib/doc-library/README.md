# Document library (મારા દસ્તાવેજ)

The user's **own** files, uploaded and read back at `/documents/library`.
Sits beside the document filler: that module *generates* drafts from a form,
this one *keeps* the papers you already have — the sale deed you were given,
a 7/12 extract, a scanned banakhat, a village map, a lawyer's PDF.

Anything can be uploaded. Only the preview is selective.

**Requires an account** — see `src/lib/auth/README.md`. Documents belong to
the account that uploaded them and are never shared between accounts.

## Where files go

Under `storage/` (gitignored; override the root with `STORAGE_DIR`), one
directory per account:

```
storage/documents/<ownerId>/<uuid>.<ext>        the bytes, byte-for-byte as uploaded
storage/documents/<ownerId>/<uuid>.meta.json    the StoredDoc record
```

**Every store function takes the owner id and builds its path from it.** That
is the isolation, not a filter applied afterwards: there is no way to name a
file outside the caller's own directory, so a forgotten ownership check cannot
leak another account's documents — the path simply doesn't resolve. `ownerId`
is written into each record too, so a file moved between directories by hand
is still not served to the wrong account.

The owner id always comes from the session cookie, never from the request
body or a query parameter, so there is nothing for a caller to change.

Sidecars rather than one index file, so two concurrent uploads can't clobber
each other's entry. Metadata is written *after* the blob: a crash between the
two leaves an orphan blob (which `listDocs` ignores) rather than a record
pointing at nothing.

Deliberately a plain directory, not a database — this phase is local demo
work. Swapping in object storage later means reimplementing only the five
functions in `store.ts`.

## Layers

1. **`types.ts`** — `StoredDoc`, the extension→kind map, the viewer switch and
   the inline-serving allow-list. No filesystem imports, so client components
   import it freely for icons and labels.
2. **`store.ts`** (`server-only`) — list / get / read / save / delete.
3. **API routes** under `src/app/api/documents/library/`.
4. **UI** — `/documents/library` (list + upload) and
   `/documents/library/[id]` (viewer).

## Kinds and what each one shows

| Kind | Extensions | Viewer |
|---|---|---|
| `pdf` | pdf | `<iframe>` → the browser's own PDF viewer |
| `word` | doc, docx, rtf, odt | **docx only**: converted to HTML by `mammoth`, shown in a `sandbox=""` iframe. The rest download. |
| `image` | png, jpg, gif, webp, avif, bmp, tif | `<img>` |
| `text` | txt, md, csv, json, log, xml | `<pre>`, UTF-8, truncated past 400k chars |
| `other` | everything else | no preview — download only |

`.doc` (Word 97 binary), `.rtf` and `.odt` are `word` kind for the icon but
have no converter, so they land on the download-only state.

## Security

Uploaded files are hostile input. Three rules hold the line:

- **The browser is never told to trust the file's own claim about its type.**
  The content type is derived from the extension we sanitized at upload,
  against a short allow-list (`contentTypeFor`). Anything not on it — an
  uploaded `.html` or `.svg` included — comes back as
  `application/octet-stream` with `Content-Disposition: attachment`, so it
  cannot run script on this origin. `X-Content-Type-Options: nosniff` stops
  the browser sniffing past that.
- **Converted Word HTML is rendered in a `sandbox=""` iframe.** mammoth
  generates its HTML from the document's structure rather than passing markup
  through, but the iframe means even a hostile `.docx` has nothing to gain.
- **Ids are UUIDs and validated as such**; the name on disk is always
  `<ownerId>/<uuid>.<ext>` with the extension stripped to `[a-z0-9]{1,8}`. A
  filename like `../../etc/passwd.txt` is stored as a *display* name only,
  sanitized to `passwd.txt`. `storagePath()` refuses any segment containing a
  separator or `..` as a last line of defence.
- **Another account's document id returns 404, not 403** — the id doesn't
  resolve inside your directory, so the API can't confirm it exists.

Non-PDF inline responses also carry `Content-Security-Policy: sandbox`. PDFs
are exempt — that directive stops Chrome's built-in viewer from loading, and
a PDF is safe inline anyway since the viewer isolates any script it carries
from the embedding page.

## Limits

- 25 MB per file (`MAX_UPLOAD_BYTES`). Uploads go through a route handler,
  not a server action, because actions cap the body at 1 MB.
- The Word preview is a *preview*: mammoth maps structure (headings, bold,
  lists, tables), not page layout. Fonts, margins, headers and footers will
  not match the original — the UI says so, and the download is the real file.
- No backups, and no quota per account. This is still demo storage; the page
  says so.
- Files are not linked to a property or a report yet — that is a follow-up.
- Gujarati filenames round-trip correctly: stored as given, and served with
  RFC 6266 `filename*=UTF-8''…` plus an ASCII fallback.

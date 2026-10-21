# Vaulted Roots — Complete Handover Brief for Claude

**Date:** 2026-10-14
**Author:** Rupert (the owner's build agent)
**Repo:** `rupertclaw/vr-freebuild-staging` (staging) / `MaplePulse/genealogy-mockup` (production via PR)
**Live URLs:**
- Production: `https://vaultedroots.com`
- Staging: `https://rupertclaw.github.io/vr-freebuild-staging/`

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Key Files](#key-files)
4. [Data Model](#data-model)
5. [Build & Deploy Process](#build--deploy-process)
6. [Privacy Scrub Context](#privacy-scrub-context)
7. [Current Open Work](#current-open-work)
8. [Known Bugs & Gotchas](#known-bugs--gotchas)
9. [Third-Party Dependencies](#third-party-dependencies)
10. [Environment & Secrets](#environment--secrets)
11. [How to Test](#how-to-test)
12. [Staging Mockups](#staging-mockups)

---

## Project Overview

Vaulted Roots is a privacy-first, zero-account family tree builder. Users create trees entirely in the browser; nothing is stored on a server. Data persists in browser `localStorage` / `indexedDB` and can be exported/imported as GEDCOM or a proprietary `.familytree` JSON format.

**Key features:**
- Person cards with name, dates, birth/death info
- Parent-child relationships (up to 2 parents per child)
- Spouse/marriage links
- Document attachment system (birth certs, marriage certs, photos) using Gemini Vision OCR
- Multi-family tree support (switch between families)
- PWA (Progressive Web App) with offline support
- Pedigree (ancestor-only) view
- Branch tree (descendant) view
- Heritage poster / printable tree view
- GA4 analytics with PWA install funnel tracking
- Monetization: Stripe subscriptions ($1.99/mo, $11.99/yr) via hosted payment links

**Target audience:** Privacy-conscious users who don't want to upload their family tree to Ancestry, MyHeritage, or other cloud-based genealogy platforms.

---

## Architecture

### Front-end
All pages are **single static HTML files** with inline CSS and JavaScript. No build step. No framework (React/Vue/Angular). Vanilla JS, DOM manipulation. This is intentional: maximum longevity, minimal complexity, easy to audit.

Pages communicate via shared data structures in memory (not a real router). The main data store is a global `STATE` object on each page.

### Hosting
- **Production:** GitHub Pages from `MaplePulse/genealogy-mockup` repo, `main` branch
- **Domain:** `vaultedroots.com` (CNAME file in repo root)
- **Also:** `vaultedroots.app` (redirects to .com)
- **Staging:** GitHub Pages from `rupertclaw/vr-freebuild-staging` repo, `stage` branch, URL: `rupertclaw.github.io/vr-freebuild-staging/`

### Back-end (minimal)
- **Cloudflare Worker:** `truenorth-gemini-proxy.rupertclaw.workers.dev`
  - Proxies Gemini API calls so the API key stays server-side
  - Endpoints: `/analyze` (Vision OCR for document analysis)
  - Rate limit: ~20 req/day on free tier
- **No database.** All user data is client-side only.
- **No auth system.** No user accounts.

### Analytics
- Google Analytics 4, property `G-MFQ3DV323Y`
- Cookieless mode (IP anonymization)
- Events: page views, PWA install funnel (`pwa_install` with labels: accepted/dismissed/banner_closed/installed/ios_banner_shown)
- Service worker version bumping tracks cache invalidation

### Payment
- Stripe hosted payment links (live mode, not test)
- Monthly: `$1.99/mo`
- Annual: `$11.99/yr`
- Payment links embedded in `index.html` pricing section
- No Stripe webhooks (static site can't receive them)

---

## Key Files

### Production Pages (these are what users see)

| File | Purpose | Size (approx) |
|------|---------|---------------|
| `index.html` | Landing page with pricing, install prompt, about modal | ~28KB |
| `family-builder.html` | Main tree editor / builder. The core app. | ~184KB |
| `data-tree.html` | Pedigree (ancestor-only) view. Full-screen, focused tree. | ~322KB |
| `families.html` | Multi-family manager. Create, switch, rename, delete families. | ~22KB |
| `heritage-poster.html` | Printable tree poster (customisable banner, fonts, etc). | ~190KB |
| `sw.js` | Service worker for PWA offline caching | ~3.8KB |
| `manifest.json` | PWA manifest | ~0.9KB |

### Supporting Assets

| File | Purpose |
|------|---------|
| `family-tree-bg-v7.webp` | Background texture for tree views |
| `vaulted-roots-shield.png` | Logo / app icon |
| `oak_fructed.svg`, `oak_104.svg`, `oak_semi.svg` | Heraldic tree SVGs for poster |
| `poster-banner-bg.jpg` | Default banner for heritage poster |
| `fonts/` | Custom web fonts (Cormorant Garamond for headers, Source Sans Pro for body) |
| `fonts.css` | @font-face declarations |
| `tree-data.js` / `tree-data.json` | Demo/test data embedded in repo (fully fictional, see Privacy section) |

### Staging-Only Experimental Files (NOT in production)

| File | Purpose |
|------|---------|
| `connection-mockup.html` | 15-person family-chart connection style demo |
| `connection-mockup-9gen.html` | 9-generation ancestor tree using real data structure (fictional names) |
| `grid-prototype.html` | Grid-based tree layout prototype |
| `branch-tree.html` | Descendant tree view prototype |
| `design1-6.html` | Various visual design explorations (some scrubbed, some contain old fictional data) |
| `compact-tree-demo.html` | Compact card layout demo |
| `gen3-shift-demo.html` | Generation shift animation demo |
| `doc-attach-demo.html` | Document attachment UI demo |
| `scan-prototype.html` | Barcode scanner prototype (abandoned) |
| `wikimedia-trees.html` | Wikimedia Commons tree image search demo |
| `debug.html`, `debug2.html` | Dev debugging helpers |

---

## Data Model

The app uses a flat array of `Person` objects. There is NO graph library (D3, Cytoscape, etc.) — all layout and rendering is hand-written.

### Person Object

```javascript
{
  id: "I1",               // String ID (GEDCOM-style: I<number>)
  firstName: "Gavin",
  lastName: "Harrow",
  birthDate: "1966-08-11",
  birthPlace: "",
  deathDate: "",
  deathPlace: "",
  gender: "M",            // "M", "F", or ""
  parents: ["I2", "I3"],  // Array of parent IDs (max 2)
  spouseId: "I4",         // String or null
  marriages: [{spouseId: "I4", date: "1990-06-15", place: ""}],
  children: ["I5", "I6"], // Array of child IDs
  generation: 0,          // Integer, calculated at load time
  // Document attachment fields (optional):
  birthCertificate: {url: "blob:...", type: "image/jpeg", extractedText: "..."},
  marriageCertificate: {...},
  deathCertificate: {...},
  photos: [{url: "blob:...", caption: ""}]
}
```

### Family Object

```javascript
{
  name: "Harrow Family Tree",
  people: [/* array of Person */],
  rootId: "I1",           // The "focus" person
  createdAt: "2026-01-15",
  updatedAt: "2026-10-14"
}
```

### State Management

`family-builder.html` and `data-tree.html` share a `STATE` object pattern:

```javascript
var STATE = {
  families: [],           // Array of Family
  currentFamilyIndex: 0,
  currentPersonId: null,
  people: [],             // Reference to current family.people
  rootId: null,           // Reference to current family.rootId
  // UI state:
  selectedPersonId: null,
  expandedGeneration: 3,
  showBlankCards: true,
  showOverview: false,
  // Document attachment state:
  docModalPersonId: null,
  docModalType: null       // 'birth'|'marriage'|'death'|'photo'
};
```

### Data Persistence

- **Primary:** `localStorage` — serialised JSON of `STATE.families`
- **Large files:** `indexedDB` — document images (Blob URLs don't persist; blobs are stored in IDB and re-hydrated on load)
- **Export formats:**
  - `.familytree` — proprietary JSON (full fidelity, includes extracted OCR text)
  - `.ged` — GEDCOM 5.5.1 (lossy: no document attachments, no extracted text)
- **Import formats:** Same as export, plus drag-and-drop GEDCOM file upload

### The `.familytree` JSON Format

This is the native save format. It is NOT standard GEDCOM. Structure:

```json
{
  "name": "Harrow Family Tree",
  "rootId": "I1",
  "people": [
    {"id": "I1", "firstName": "Gavin", "lastName": "Harrow", "birthDate": "1966-08-11", ...},
    {"id": "I2", "firstName": "Joseph", "lastName": "Harrow", ...}
  ],
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-10-14T12:00:00Z"
}
```

Note: IDs are strings like `"I1"`, `"I2"`, etc. When exported from GEDCOM, the parser converts GEDCOM's `@I1@` format to just `I1`.

---

## Build & Deploy Process

### Important: No Build Step
There is no `npm install`, no `webpack`, no `vite`. The entire app is static HTML files. Deploy = `git push`.

### Branch Strategy

| Branch | Purpose | Rules |
|--------|---------|-------|
| `main` | Production. Live on `vaultedroots.com`. | **Protected.** The owner merges PRs here. Rupert NEVER pushes directly. |
| `stage` | Staging. Live on `rupertclaw.github.io/vr-freebuild-staging/`. | Rupert pushes freely. Used by the owner to preview before merging. |
| Feature branches | `rupert/feature-name` — created off `main` or `stage` | Merged to `stage` first, then PR to `main`. |

### Deploy Flow (Rupert → Staging)
1. Make changes locally in `vr-freebuild-staging/` working directory
2. `git add <files>`
3. `git commit -m "..."`
4. `git push origin stage`
5. Wait ~60 seconds for GitHub Pages to rebuild
6. Verify on `https://rupertclaw.github.io/vr-freebuild-staging/<file>.html`

### Deploy Flow (Owner → Production)
1. The owner reviews the `stage` branch on staging URL
2. Owner creates PR from `stage` → `main` on `MaplePulse/genealogy-mockup` (or approves Rupert's PR)
3. Merges PR on GitHub web UI
4. GitHub Pages rebuilds `main` → `vaultedroots.com`

### Service Worker Cache Busting
`sw.js` uses a version string at the top:
```javascript
const CACHE_NAME = 'vaultedroots-v152'; // bump this on every deploy
```
When deploying ANY change to a production page, bump this version. If you don't, returning users see the old cached version. The sw.js file itself is also cached, so the version string inside it is the only way to force an update.

**Critical:** After deploying `main`, verify the new SW version is active by checking `chrome://serviceworker-internals/` or looking at `navigator.serviceWorker.controller.scriptURL` in the console.

### Commit Author Convention
Vercel (used for other projects) requires commits to be authored as:
```
MaplePulse <255840554+MaplePulse@users.noreply.github.com>
```
For Vaulted Roots (GitHub Pages), this is NOT required but is used consistently anyway.

---

## Privacy Scrub Context

This is CRITICAL context. In October 2026, a major privacy pass was completed (PRs #83, #86, #87). Real personal identifiers were removed from the production pages (see "Staging Repo Scrub" below for the follow-up on this repo). The project owner is now described as:

> "A retired Canadian individual who is a hobby developer."

### What Was Scrubbed
1. **Real name** — Removed from all HTML text, About modals, and comments
2. **Real age/date of birth** — Removed
3. **Personal Gmail address** — Replaced with Formspree form (`formspree.io/f/xaqglnpa`)
4. **Personal Facebook profile link** — Replaced with business page link (`fb.me/VaultedRoots`)
5. **Real family data** — All demo/test trees now use fictional names

### Fictional Demo Names
Demo data, test files and mockups use fictional families (Harrow, Fenwick, Marsh, Elder, Vale, etc.; root person "Gavin Harrow"). The mapping from real to fictional names is deliberately **not** recorded anywhere in this repo — publishing it would undo the pseudonymisation.

### Staging Repo Scrub (2026-10-14)
The October privacy PRs were applied to production pages, but this public staging repo still held real family data. On 2026-10-14 it was cleaned:
- Real GEDCOM files, `.familytree` exports, the `downloads/` folder, old `data-tree.html` backups and the backup-download pages were deleted.
- `tree-data.js` / `tree-data.json` were regenerated with every given name and surname swapped and dates cut to the year.
- Git history was rewritten on all branches to remove the deleted files and replace real names in old file versions and commit messages. **Any clone made before 2026-10-14 must be deleted and re-cloned — never push from an old clone, or the old history comes back.**

### Demo/Test Data Policy
- Any new demo data MUST be fully fictional: swap given names AND surnames, and trim exact dates. Never commit real family data, real GEDCOMs or real `.familytree` exports to the repo (they are git-ignored).

---

## Current Open Work

### 1. Family-Chart Connection Style Experiment
**Status:** Superseded (2026-10-21). `family-builder.html`'s `layoutTree()` was rewritten as an "hourglass" layout (the Topola / family-chart approach): focus at the centre of row 0, father's side always left of the centre line and mother's right, ancestors' siblings and other partners on the outer side of their couple, half-sibling families grouped on their shared parent's side, subtrees packed by contour (no collision pass), and one rounded-corner bus per family drawn from the couple midpoint. The focus's in-laws are no longer shown in the focus view (the partner's card shows the 🌿 badge). "Add Parent" is now "Add Father" / "Add Mother" and stores sex; first-name sex guessing was removed. The mockups below are kept for reference only.
**Files:** `connection-mockup.html`, `connection-mockup-9gen.html`

We are evaluating whether to adopt the connection-drawing approach from the open-source `family-chart` library (MIT license) into the main builder.

**Three rules from family-chart:**
1. **Couple junction point:** Parent-child lines attach to the MIDPOINT between the couple, never to one parent individually. Current Vaulted Roots draws to each parent separately, creating visual mess.
2. **Link deduplication:** Each connection gets an ID from the sorted pair of card IDs. Shared lines are drawn exactly once. Current code can double-draw.
3. **Orthogonal elbows with rounded corners:** Instead of straight diagonals, use right-angle turns with small curves (`d3.curveBasis` or `d3.curveMonotoneY`).

**15-person mockup:** `connection-mockup.html` — small family (Gavin Harrow + spouse + 3 children + grandparents). New style: 14 paths, 0 crossings. Old style: 28 paths, 0 crossings.

**9-generation mockup:** `connection-mockup-9gen.html` — real 9-generation ancestor tree (511 people from export, fictionalised to Harrow/Fenwick/Marsh). 69 cards rendered (34 real + 35 blank "unknown" stubs). NEW mode: 136 paths, 0 crossings. OLD mode: 102 paths, 0 crossings.

**Next step:** Awaiting the owner's decision on which style they prefer. If approved, port the 3 rules into `family-builder.html`'s actual connection-drawing code. This is a bigger job because the custom layout engine must feed new link math.

**Reference:**
- family-chart repo: `https://github.com/donatso/family-chart` (MIT, ~770 stars)
- family-chart demo: `https://donatso.github.io/family-chart-doc/`
- Key source files: `src/layout/create-links.ts`, `src/renderers/view-links.ts`

### 2. Document Attachment System
**Status:** In production, but could be extended
**File:** `family-builder.html`

Users can attach photos, birth certificates, marriage certificates, and death certificates to person cards. Uses Gemini Vision API via Cloudflare proxy for OCR text extraction.

**Flow:**
1. User clicks "Attach Doc" on a person card
2. Selects file (image or PDF)
3. File is stored in `indexedDB` as a Blob
4. If it's a certificate, optionally runs OCR via Gemini proxy
5. Extracted text is stored in the person object (e.g., `birthCertificate.extractedText`)
6. On export to GEDCOM, document data is LOST (GEDCOM doesn't support blobs)
7. On export to `.familytree`, document data is preserved

**Known limitation:** OCR accuracy is ~85% on typed certificates, much lower on handwritten historical documents. No manual text entry fallback currently (user can't correct OCR output by typing).

### 3. Multi-Marriage / Step-Parent Support
**Status:** Partial. Basic support exists but UI is rough.

The data model supports `marriages: [{spouseId, date, place}]` and multiple parents, but the builder UI assumes one spouse at a time. Adding a second spouse requires manually editing the JSON or importing from GEDCOM.

**Recent fixes:** PR #75+ added step-connector lines for off-level spouses (spouses placed in different generations due to age gaps).

### 4. Mobile UX
**Status:** Continuously improving

Recent fixes:
- About button tap failure on mobile (PR #81/82): `pointerdown` → `click` to avoid synthesized-click backdrop-dismiss bug
- 44px minimum tap targets
- `touch-action: manipulation` to eliminate double-tap zoom delays
- Header/footer spacing adjustments for small screens

**Known issue:** Drag-to-pan on mobile can accidentally trigger card selection. Needs `touch-action: none` on the stage but `touch-action: auto` on cards — tricky to get right.

### 5. PWA Install Analytics
**Status:** Merged (PR #87), live

Tracks PWA install funnel across all app pages:
- `pwa_install` event labels: `accepted`, `dismissed`, `banner_closed`, `installed`, `ios_banner_shown`
- iOS Safari gets a custom hint banner ("Add to Home Screen") since iOS doesn't support `beforeinstallprompt`
- GA4 property: `G-MFQ3DV323Y`

---

## Known Bugs & Gotchas

### Critical: Service Worker Stale Content
The service worker (`sw.js`) caches HTML files aggressively. Even in a fresh headless browser session, the SW can serve STALE HTML. **When testing changes in a browser:**
1. Open DevTools → Application → Service Workers
2. Click "Unregister" on the `vaultedroots.com` or `rupertclaw.github.io` SW
3. Hard-refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. Verify `navigator.serviceWorker.controller.scriptURL` reflects the latest version

### Headless Chromium Gotcha for Testing
When using Playwright/headless Chromium to verify pages:
```javascript
// Before asserting on new code:
await navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
await window.caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))));
location.reload();
```

### Data Format Inconsistencies in `.familytree` Files
Some exported `.familytree` files have **stringified fields** that should be numbers or arrays:
```javascript
// From the user's export file:
{"id": "1", "gen": "1", "parents": "[4,5]", "spouseId": "3"}
// Should be:
{"id": "1", "gen": 1, "parents": [4, 5], "spouseId": "3"}
```
The parser must coerce these (currently done in the mockup scripts, not in the main app). If the main app encounters stringified arrays, it may fail to render parent-child links.

### Spouse Link Direction Bug (Fixed in mockups, check in main builder)
When drawing spouse lines, the code MUST sort the pair by X position before drawing left-to-right. If wife sits left of husband and code assumes husband-is-left, the line draws backwards through both cards. Fixed in `connection-mockup.html` by adding `if (a.x > b.x) { var tmp=a; a=b; b=tmp; }` before drawing.

### SVG Clip Bug (Fixed in mockups, check if present elsewhere)
SVG elements with negative-coordinate content will be CLIPPED unless `overflow: visible` is set on the SVG element. This was the root cause of invisible connection lines in `connection-mockup-9gen.html`. Fixed by adding:
```css
#linkSvg { position: absolute; top: 0; left: 0; overflow: visible; pointer-events: none; }
```
Check any other pages that draw SVG links outside their bounding box.

### GEDCOM Import: Parent ID Resolution
GEDCOM files use cross-reference IDs like `@I1@`, `@F1@` (family records). The parser must:
1. Strip `@` wrappers
2. Map family records (`F1`) to parent pairs
3. Handle cases where a family record lists a child but the child's individual record doesn't list parents (back-fill from family)
4. Handle remarriage (same child appearing in multiple families with different parents)

The current parser does most of this but edge cases with remarriage can create duplicate parent entries or broken links.

### IndexedDB Blob Re-hydration
When loading a `.familytree` file that contains document attachments, the Blob URLs in the JSON are **invalid** (they were `blob:` URLs from the original browser session). The loader must:
1. Detect `blob:` URLs in imported data
2. Look up the actual Blob in indexedDB by a stored key
3. Create new Blob URLs for the current session

If this fails, document images show as broken links. Currently falls back to a placeholder image.

---

## Third-Party Dependencies

All loaded from CDN (no npm/node_modules):

| Library | Version | CDN URL | Used In |
|---------|---------|---------|---------|
| html2canvas | 1.4.1 | Inline in repo (`html2canvas.min.js`) | `heritage-poster.html` (print-to-PNG) |
| Google Fonts | — | `https://fonts.googleapis.com/css2?family=...` | All pages |
| GA4 | gtag.js | `https://www.googletagmanager.com/gtag/js?id=G-MFQ3DV323Y` | All user-facing pages |
| Formspree | — | `https://formspree.io/f/xaqglnpa` | Feedback modal |
| Gemini API | v1beta | Via Cloudflare proxy | Document OCR |

**No build dependencies.** No package.json. No node_modules.

---

## Environment & Secrets

### Files on VPS (NOT in repo)
Secrets live in `~/.hermes/profiles/rupert/.env`:

```bash
# GitHub
RUPERT_GITHUB_PAT=ghp_xxxxxxxxxxxxxxxxxxxx      # For repo pushes under rupertclaw

# Vercel (for other projects, NOT Vaulted Roots)
RUPERT_VERCEL_TOKEN=vru_xxxxxxxxxxxxxxxxxxxxxxxx

# Cloudflare (Gemini proxy worker)
CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx

# Gemini
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxx

# Google Analytics (measurement protocol - rarely used)
GA_MEASUREMENT_ID=G-MFQ3DV323Y
GA_API_SECRET=xxxxxxxx

# Stripe (payment links are public, but webhook verification would need this)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
```

### Never Hardcode
- API keys must NEVER appear in client-side JS
- The Gemini key is only in the Cloudflare Worker (server-side)
- GitHub PAT is only in `.env` and used in shell commands

---

## How to Test

### Local Development
No server needed. Just open files directly in a browser:
```bash
cd ~/workspace/projects/vr-freebuild-staging
python3 -m http.server 8000
# Or simply:
# chromium --headless=new --no-sandbox file:///home/openclaw/workspace/projects/vr-freebuild-staging/family-builder.html
```

### Automated Verification (Headless Chromium + CDP)
The standard test harness on this VPS uses Playwright's Chromium binary with raw Chrome DevTools Protocol (CDP) over WebSocket. Full script template:

```python
import subprocess, json, re, socket, base64, os, struct, time

# 1. Launch headless chromium
chrome = "/home/openclaw/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome"
proc = subprocess.Popen([
    chrome, "--remote-debugging-port=9333", "--remote-allow-origins=*",
    "--headless=new", "--no-sandbox",
    "file:///home/openclaw/workspace/projects/vr-freebuild-staging/family-builder.html"
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(3)

# 2. Get WebSocket URL
r = subprocess.run(["curl", "-s", "http://127.0.0.1:9333/json"], capture_output=True, text=True)
ws_url = [t["webSocketDebuggerUrl"] for t in json.loads(r.stdout) if t["type"] == "page"][0]

# 3. Connect via WebSocket (raw, no Playwright library)
# ... (see workspace tmp files for full WS class implementation)

# 4. Evaluate JS and assert
ws.send({"id": 1, "method": "Runtime.evaluate", "params": {"expression": "STATE.people.length"}})
result = json.loads(ws.recv())["result"]["result"]["value"]
assert int(result) > 0, "No people loaded"
```

**Important:** Before testing ANY page that uses a service worker, unregister it first:
```javascript
navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
```

### Visual Regression Testing
Screenshots are captured via CDP `Page.captureScreenshot` and saved to `/tmp/` or `/home/openclaw/workspace/tmp/`. Compare pixel counts (sienna for spouse links, brown for connectors) to verify lines render.

---

## Staging Mockups

These are experimental pages on the staging URL for evaluating new features:

### connection-mockup.html
- **URL:** `https://rupertclaw.github.io/vr-freebuild-staging/connection-mockup.html`
- **Purpose:** Compare family-chart connection style vs current style on a small 3-generation family
- **Data:** Fictional (Gavin Harrow, Rose Fenwick, 3 children, grandparents)
- **Toggle:** "family-chart links" / "our current links" buttons at top
- **What to check:** Toggle both modes, drag to pan, zoom with scroll wheel. Look for lines crossing through cards.

### connection-mockup-9gen.html
- **URL:** `https://rupertclaw.github.io/vr-freebuild-staging/connection-mockup-9gen.html`
- **Purpose:** Same comparison on a real 9-generation ancestor tree
- **Data:** 511 people from user's actual export (fictionalised names). Only 69 cards rendered (the connected ancestors of the root person). 35 are blank "unknown" stubs (dashed outline cards showing where ancestors are missing).
- **Canvas size:** 6920 x 1864 pixels (very wide — you'll need to zoom out to see the whole tree)
- **What to check:**
  - NEW mode should show orthogonal elbows with rounded corners (Q curves in SVG paths)
  - OLD mode shows straight diagonals
  - Both should have 0 lines crossing through cards
  - Blank cards appear as dashed outlines with "unknown" label

### families.html (staging)
- **URL:** `https://rupertclaw.github.io/vr-freebuild-staging/families.html`
- **Purpose:** Multi-family manager. Create new families, switch between them, rename, delete.

### data-tree.html (staging)
- **URL:** `https://rupertclaw.github.io/vr-freebuild-staging/data-tree.html`
- **Purpose:** Pedigree (ancestor-only) view. Full-screen, focused on one person, shows ancestors up to configured depth.

### family-builder.html (staging)
- **URL:** `https://rupertclaw.github.io/vr-freebuild-staging/family-builder.html`
- **Purpose:** The main tree builder. This is the most complex page (~184KB of inline JS). Add people, drag cards, edit details, attach documents, export.

---

## Contact & Resources

| Resource | Value |
|----------|-------|
| Production repo | `https://github.com/MaplePulse/genealogy-mockup` |
| Staging repo | `https://github.com/rupertclaw/vr-freebuild-staging` |
| Production URL | `https://vaultedroots.com` |
| Staging URL | `https://rupertclaw.github.io/vr-freebuild-staging/` |
| GA4 Property | `G-MFQ3DV323Y` |
| Formspree Feedback | `https://formspree.io/f/xaqglnpa` |
| Vaulted Roots FB Page | `https://fb.me/VaultedRoots` (ID: 61591673636516) |
| Gemini Proxy | `https://truenorth-gemini-proxy.rupertclaw.workers.dev` |
| Stripe Monthly | `$1.99/mo` |
| Stripe Annual | `$11.99/yr` |

---

## For Claude: Where to Start

If you're picking up work on this project with NO prior context:

1. **Read this brief** (you're doing that now ✓)
2. **Open `family-builder.html`** in a browser — this is the core app. Understand the `STATE` object and the `render()` function.
3. **Check the staging mockups** — `connection-mockup.html` and `connection-mockup-9gen.html` show the current experiment.
4. **Look at recent commits** on the `stage` branch to see what changed last.
5. **Never commit real names** — if testing with personal data, fully fictionalise it (given names, surnames and exact dates) before it touches the repo.
6. **Bump `sw.js` version** on every production deploy.
7. **Test on mobile** — tap targets, drag-to-pan, modal scroll lock.
8. **Use headless Chromium + CDP** for automated verification, not manual browser clicking.

**Current biggest open question:** Should we port the family-chart connection style (couple-midpoint, dedup, orthogonal elbows) into the main builder? The owner needs to decide. The mockups are ready for their review.

---

*End of handover brief. Last updated by Rupert on 2026-10-14.*

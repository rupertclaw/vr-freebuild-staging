# Vaulted Roots

Privacy-first genealogy PWA. All data stays in the browser (IndexedDB + localStorage). No server, no account, no tracking.

## Files

| File | Purpose |
|---|---|
| `data-tree.html` | Main app — family tree, detail panel, GEDCOM import/export |
| `index.html` | Redirect stub to `data-tree.html` (ARCH-01) |
| `families.html` | Family sheets view |
| `heritage-poster.html` | Printable heritage poster |
| `branch-tree.html` | Branch view (alternative tree layout) |
| `sw.js` | Service worker (offline caching) |
| `manifest.json` | PWA manifest |

## Deployment

Staging: `https://rupertclaw.github.io/vaultedroots-staging/data-tree.html`
Production: `https://vaultedroots.com/`

## Development

All changes go to `stage` branch. Production merges via PR from `stage` → `main`.

Bump `CACHE_NAME` in `sw.js` on every deploy so users get fresh code.
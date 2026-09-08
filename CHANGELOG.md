# Changelog

## 1.0.0

Initial release.

### Two layers
- Application layer (`ds-`): flat, border-driven, dense. Light and dark themes.
- Marketing layer (`mk-`): warm grounds, editorial type, one accent per page.
  Light-only by design.

### Skeleton / skin split
- `css/` declares no tokens; `themes/` declares no component rules.
- `scripts/check-tokens.mjs` fails the build if either rule breaks, or if any
  theme drifts from another. This is what keeps themes interchangeable.

### Themes
- `blank`, `openseo` and `editorial`, each in an app and a marketing variant.
- `editorial` exists to stress the split: paper ground, oxblood accent, sharp
  corners, elevation at rest, serif headings, taller controls — with no change to
  the skeleton. Writing it surfaced four contract faults, all fixed:
  `--shadow-none` renamed `--shadow-rest`, a hard-coded scrim promoted to
  `--scrim`, a guard that counted tokens quoted in comments, and headings that had
  no way to change face (`--font-display`).
- The blank app theme gives light and dark their own feedback hues so all pass
  AA as text; the reconstructed theme shares one set and fails on white.

### Components
- 47 application, 44 marketing, plus a 37-icon inline lucide sprite.
- Overlays: a native `<dialog>`, a keyboard-navigable dropdown, a drawer, a
  portalled tooltip, and a toast queue with a polite live region.
- Data: a DataTable that renders the chrome and leaves the rows to you, sortable
  headers that work without JavaScript, an area chart and a sparkline that finally
  read the chart tokens.
- Marketing: a content set (prose, article header, author bio, pull quote, share,
  newsletter, video facade), site navigation (docs nav, anchor nav, category
  filter, pagination) and conversion pieces (period toggle, trust strip, sticky
  CTA, marquee, rating).
- A living component reference at `/design-system`, rendered from source.
- Marketing covers hero (centered / split), section, heading, split, card, quote,
  logos, stats, CTA band, FAQ, pricing, comparison table, article card,
  breadcrumb, nav with mega-menu, terminal, footer.

### Scaffold
- `bin/init.mjs` vendors the system into a new Astro 7 project with four working
  pages: landing, pricing, blog, dashboard.

### Provenance
- Reconstructed from the OpenSEO implementation (MIT), rebuilt brand- and
  domain-neutral. `docs/design-system.html` is kept as the origin audit and
  stays SEO-specific on purpose.

Verified on Node 24.20.0 with Astro 7.3.2.

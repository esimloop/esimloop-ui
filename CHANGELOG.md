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
- `app-blank`, `app-openseo`, `marketing-blank`, `marketing-openseo`.
- The blank app theme gives light and dark their own feedback hues so all pass
  AA as text; the reconstructed theme shares one set and fails on white.

### Components
- 14 application, 18 marketing, plus a 33-icon inline lucide sprite.
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

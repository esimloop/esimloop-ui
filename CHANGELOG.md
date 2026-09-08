# Changelog

## 1.0.0

Initial release.

- Two design systems reconstructed from the OpenSEO source (MIT): an application
  layer (`ds-`) and a marketing layer (`mk-`).
- Skeleton/skin split with an enforced token contract (`scripts/check-tokens.mjs`).
- Four themes: `app-openseo`, `app-blank`, `marketing-openseo`, `marketing-blank`.
  The blank app theme gives light and dark their own feedback hues so all pass AA
  as text, which the reconstructed theme does not.
- 23 Astro components and a 33-icon inline lucide sprite.
- `bin/init.mjs` scaffolds an Astro 7 project with the system vendored.
- Full specification in `docs/design-system.html` (12 sections, 4 proof screens).

Verified on Node 24.20.0 with Astro 7.3.2.

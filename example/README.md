# example

Scaffolded from the SEO platform design system, theme **blank**.

    npm install
    npm run dev

## Where things live

| Path | What it is |
| --- | --- |
| `src/design-system/themes/` | **The skin — edit this.** `app-blank.css` and `marketing-blank.css` hold every colour, size and radius. |
| `src/design-system/css/` | The skeleton. Components reference tokens and never hard-code a value — leave it alone. |
| `src/design-system/astro/` | Astro components for both layers. |
| `src/styles/app.css` | Loads the theme, then the skeleton. That order matters. |

## Two layers

- **App** (`ds-` classes) — dense, flat, border-driven. Light and dark.
- **Marketing** (`mk-` classes) — warm, editorial, one accent per page. Light only.

They share a typeface and nothing else. Do not mix their classes on one page.

## Re-skinning

Change `--accent`, `--content` and the surface ramp in the theme file. Everything
else derives. Keep the accent at 4.5:1 or better against `--surface-card`.

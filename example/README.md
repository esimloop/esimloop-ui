# example

Scaffolded from esimloop-ui, theme **blank**.

    npm install
    npm run dev

## Pages

| Route | Layer | Exercises |
| --- | --- | --- |
| `/` | marketing | announce bar, hero (split), logos, features, split, steps, tabs, stats, quotes, CTA |
| `/pricing` | marketing | pricing, comparison table, FAQ, breadcrumb |
| `/blog` | marketing | article grid, breadcrumb |
| `/blog/example-post` | marketing | prose, article header, author, table of contents, callout, post nav |
| `/contact` | marketing | form fields, team grid |
| `/404` | marketing | not-found pattern |
| `/app` | application | shell, sidebar, KPIs, stat strip, data table |

## Where things live

| Path | What it is |
| --- | --- |
| `src/design-system/themes/` | **The skin — edit this.** `app-blank.css` and `marketing-blank.css` hold every colour, size and radius. |
| `src/design-system/css/` | The skeleton. Components reference tokens and never hard-code a value — leave it alone. |
| `src/design-system/astro/` | Components for both layers. |
| `src/styles/app.css` | Loads the theme, then the skeleton. That order matters. |

## Two layers

- **App** (`ds-`) — dense, flat, border-driven. Light and dark.
- **Marketing** (`mk-`) — warm, editorial, one accent per page. Light only.

They share a typeface and nothing else. Don't mix their classes on one page.

## Re-skinning

Open the theme file and change four things: `--accent` (keep it at 4.5:1 or
better against `--surface-card`), `--content`, the surface ramp, and
`--font-sans`. Everything else derives.

#!/usr/bin/env node
/**
 * Scaffold a new Astro project wired to this design system.
 *
 *   node bin/init.mjs <target-dir> [--name <pkg-name>] [--theme openseo|blank]
 *
 * The system is VENDORED (copied into src/design-system), not installed as a
 * dependency. For a starter kit that is the right trade: you own the files, the
 * theme is editable in place, and there is no package resolution to debug.
 * Re-run with --force to refresh the vendored copy after the kit changes.
 */
import { cp, mkdir, writeFile, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);
const target = argv.find((a) => !a.startsWith("--") && argv[argv.indexOf(a) - 1] !== `--name` && argv[argv.indexOf(a) - 1] !== `--theme`);

if (!target) {
  console.error("Usage: node bin/init.mjs <target-dir> [--name <pkg>] [--theme openseo|blank] [--force]");
  process.exit(1);
}

const dir = resolve(process.cwd(), target);
const pkgName = flag("name", basename(dir));
const theme = flag("theme", "blank");
if (!["openseo", "blank"].includes(theme)) {
  console.error(`Unknown theme "${theme}". Use "openseo" or "blank".`);
  process.exit(1);
}

if (existsSync(dir) && !has("force")) {
  const entries = await readdir(dir);
  if (entries.length) {
    console.error(`${dir} is not empty. Re-run with --force to overwrite.`);
    process.exit(1);
  }
}

// ------------------------------------------------------------------- files
const file = (p, body) => ({ path: p, body });

const files = [
  file(
    "package.json",
    JSON.stringify(
      {
        name: pkgName,
        private: true,
        type: "module",
        scripts: {
          dev: "astro dev",
          build: "astro build",
          preview: "astro preview",
          check: "astro check",
        },
        dependencies: { astro: "^7.3.2" },
        engines: { node: ">=20" },
      },
      null,
      2,
    ) + "\n",
  ),

  file(
    "astro.config.mjs",
    `import { defineConfig } from "astro/config";

export default defineConfig({
  // The design system is plain CSS and .astro components - nothing to add here.
});
`,
  ),

  file(
    "tsconfig.json",
    JSON.stringify({ extends: "astro/tsconfigs/strict" }, null, 2) + "\n",
  ),

  file(".gitignore", "node_modules/\ndist/\n.astro/\n.env\n.DS_Store\n"),

  file(
    "src/styles/app.css",
    `/* Load a THEME first, then the SKELETON. That order is the whole system:
   the skeleton only references tokens, the theme supplies their values.

   To re-skin this project, edit src/design-system/themes/app-${theme}.css
   (and marketing-${theme}.css). Nothing else needs to change.

   Swap in the reconstructed values instead by pointing these at
   app-openseo.css / marketing-openseo.css. */
@import "../design-system/themes/app-${theme}.css";
@import "../design-system/themes/marketing-${theme}.css";
@import "../design-system/css/index.css";
`,
  ),

  file(
    "src/layouts/AppLayout.astro",
    `---
import "../styles/app.css";
import IconSprite from "../design-system/astro/app/IconSprite.astro";

interface Props {
  title: string;
}
const { title } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    />
  </head>
  <body class="ds-root" style="margin:0">
    <IconSprite />
    <slot />
  </body>
</html>
`,
  ),

  file(
    "src/layouts/MarketingLayout.astro",
    `---
import "../styles/app.css";
import IconSprite from "../design-system/astro/app/IconSprite.astro";

interface Props {
  title: string;
  description?: string;
}
const { title, description } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
    />
  </head>
  <!-- The marketing layer is light-only by design; it declares no dark palette. -->
  <body class="mk" style="margin:0">
    <IconSprite />
    <slot />
  </body>
</html>
`,
  ),

  file(
    "src/components/Nav.astro",
    `---
import Sidebar from "../design-system/astro/app/Sidebar.astro";
import type { NavGroup } from "../design-system/astro/app/Sidebar.astro";

interface Props {
  active?: string;
}
const { active = "dashboard" } = Astro.props;

// Grouped by what the data is ABOUT: tools that can point at any domain, versus
// this workspace's own site. That distinction is the information architecture.
const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/app", icon: "dashboard", active: active === "dashboard" }],
  },
  {
    label: "Research",
    items: [
      { label: "Keyword research", href: "/app", icon: "search", active: active === "keywords" },
      { label: "Domain overview", href: "/app", icon: "globe", active: active === "domain" },
      { label: "Backlinks", href: "/app", icon: "link", active: active === "backlinks" },
    ],
  },
  {
    label: "My site",
    items: [
      { label: "Rank tracking", href: "/app", icon: "trend", active: active === "rank" },
      { label: "Site audit", href: "/app", icon: "audit", active: active === "audit" },
    ],
  },
];
---
<Sidebar brand="Product" groups={groups}>
  <button slot="switcher" class="ds-switcher" type="button">
    <span class="ds-switcher__avatar">W</span>
    <span class="ds-switcher__name">Workspace</span>
  </button>
  <a slot="footer" class="ds-navitem" href="/app"><span>Settings</span></a>
</Sidebar>
`,
  ),

  file(
    "src/pages/app.astro",
    `---
import AppLayout from "../layouts/AppLayout.astro";
import AppShell from "../design-system/astro/app/AppShell.astro";
import Nav from "../components/Nav.astro";
import Button from "../design-system/astro/app/Button.astro";
import Card from "../design-system/astro/app/Card.astro";
import KpiCard from "../design-system/astro/app/KpiCard.astro";
import Score from "../design-system/astro/app/Score.astro";
import Badge from "../design-system/astro/app/Badge.astro";

// Example rows, so the first paint shows what the screen does.
const rows = [
  { keyword: "seo audit tool", volume: "14,800", kd: 41, cpc: "2.41", position: 3 },
  { keyword: "technical seo checklist", volume: "9,900", kd: 28, cpc: "1.85", position: 7 },
  { keyword: "free backlink checker", volume: "22,200", kd: 88, cpc: "3.05", position: 18 },
];
---
<AppLayout title="Dashboard">
  <AppShell brand="Product">
    <Nav slot="sidebar" active="dashboard" />

    <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;justify-content:space-between">
      <div>
        <h1 class="ds-h1">Dashboard</h1>
        <p class="ds-body ds-text-secondary" style="margin:4px 0 0">
          Example data. Replace with your own.
        </p>
      </div>
      <div class="row-tight" style="display:flex;gap:8px">
        <Button size="sm" iconStart="download">Export</Button>
        <Button size="sm" variant="primary" iconStart="plus">New project</Button>
      </div>
    </div>

    <div style="display:grid;gap:16px;grid-template-columns:repeat(2,1fr)">
      <KpiCard label="Organic traffic" value="128.4K" delta={12} deltaLabel="vs. prev. 30d" />
      <KpiCard label="Organic keywords" value="24,180" delta={-3} deltaLabel="vs. prev. 30d" />
      <KpiCard label="Referring domains" value="3,942" hint="Updated today" />
      <KpiCard label="Backlinks" value="318K" loading />
    </div>

    <Card title="Top keywords" flush>
      <Button slot="actions" size="xs" variant="ghost" iconStart="filters">Filters</Button>
      <div class="ds-table-wrap">
        <table class="ds-table ds-table--sm">
          <thead>
            <tr>
              <th data-col="id">Keyword</th>
              <th data-align="right">Volume</th>
              <th data-align="right">KD</th>
              <th data-align="right">CPC</th>
              <th data-align="right">Position</th>
              <th data-align="center">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr>
                <td data-col="id" style="font-weight:500">{r.keyword}</td>
                <td data-align="right">{r.volume}</td>
                <td data-align="right"><Score value={r.kd} label={\`Difficulty \${r.kd}\`} /></td>
                <td data-align="right">{r.cpc}</td>
                <td data-align="right"><span class="ds-mono">{r.position}</span></td>
                <td data-align="center">
                  <Badge tone={r.position <= 10 ? "success" : "neutral"}>
                    {r.position <= 10 ? "Top 10" : "Tracking"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </AppShell>
</AppLayout>
`,
  ),

  file(
    "src/pages/index.astro",
    `---
import MarketingLayout from "../layouts/MarketingLayout.astro";
import MkNav from "../design-system/astro/marketing/MkNav.astro";
import MkHero from "../design-system/astro/marketing/MkHero.astro";
import MkSection from "../design-system/astro/marketing/MkSection.astro";
import MkButton from "../design-system/astro/marketing/MkButton.astro";
import MkCard from "../design-system/astro/marketing/MkCard.astro";
import MkQuote from "../design-system/astro/marketing/MkQuote.astro";
import MkFooter from "../design-system/astro/marketing/MkFooter.astro";
import Icon from "../design-system/astro/app/Icon.astro";

const features = [
  { title: "Keyword research", body: "Find ideas, demand, difficulty and live results.", icon: "search" },
  { title: "Domain overview", body: "Estimate organic traffic and ranking keywords.", icon: "globe" },
  { title: "Site audit", body: "Crawl pages and surface technical issues.", icon: "audit" },
] as const;
---
<MarketingLayout title="Product" description="Replace this description.">
  <MkNav
    brand="Product"
    links={[
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#" },
    ]}
    ctaHref="/app"
  />

  <MkHero
    title="A headline that says what this does."
    subtitle="One sentence of support underneath, in muted ink, never wider than about fifty characters."
    note="No credit card required"
  >
    <MkButton size="lg" variant="primary" href="/app">Start free</MkButton>
    <MkButton size="lg" variant="secondary" href="#features">See features</MkButton>
  </MkHero>

  <MkSection ground="quiet" id="features">
    <div style="max-width:640px">
      <p class="mk-eyebrow">Everything in one place</p>
      <h2 class="mk-display-md">See the whole picture</h2>
      <p class="mk-body-lg mk-muted" style="margin:16px 0 0">
        Replace this copy. The accent colour is used exactly once on this page - on
        the one action that matters most.
      </p>
    </div>

    <div class="mk-feature-grid">
      {features.map((f) => (
        <MkCard kind="feature" title={f.title} body={f.body} href="#">
          <div
            slot="media"
            style="height:120px;display:grid;place-items:center;color:var(--m-ink-tertiary)"
          >
            <Icon name={f.icon} size="xl" />
          </div>
        </MkCard>
      ))}
    </div>
  </MkSection>

  <div class="mk-quotes">
    <div class="mk-container">
      <h2 class="mk-display-md" style="text-align:center">What people say</h2>
      <div class="mk-quote-grid">
        <MkQuote quote="Replace with a real quote." name="A. Rivera" meta="Head of growth" initials="AR" />
        <MkQuote quote="Replace with a real quote." name="S. Moreau" meta="Founder" initials="SM" />
        <MkQuote quote="Replace with a real quote." name="T. Lambert" meta="Consultant" initials="TL" />
      </div>
    </div>
  </div>

  <MkFooter
    brand="Product"
    blurb="Product updates and the occasional behind-the-scenes."
    columns={[
      { label: "Product", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#" }] },
      { label: "Resources", links: [{ label: "Docs", href: "#" }, { label: "Blog", href: "#" }] },
      { label: "Company", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }] },
    ]}
  />
</MarketingLayout>
`,
  ),

  file(
    "README.md",
    `# ${pkgName}

Scaffolded from the SEO platform design system, theme **${theme}**.

    npm install
    npm run dev

## Where things live

| Path | What it is |
| --- | --- |
| \`src/design-system/themes/\` | **The skin — edit this.** \`app-${theme}.css\` and \`marketing-${theme}.css\` hold every colour, size and radius. |
| \`src/design-system/css/\` | The skeleton. Components reference tokens and never hard-code a value — leave it alone. |
| \`src/design-system/astro/\` | Astro components for both layers. |
| \`src/styles/app.css\` | Loads the theme, then the skeleton. That order matters. |

## Two layers

- **App** (\`ds-\` classes) — dense, flat, border-driven. Light and dark.
- **Marketing** (\`mk-\` classes) — warm, editorial, one accent per page. Light only.

They share a typeface and nothing else. Do not mix their classes on one page.

## Re-skinning

Change \`--accent\`, \`--content\` and the surface ramp in the theme file. Everything
else derives. Keep the accent at 4.5:1 or better against \`--surface-card\`.
`,
  ),
];

// ------------------------------------------------------------------ scaffold
await mkdir(dir, { recursive: true });

const vendor = join(dir, "src", "design-system");
if (has("force") && existsSync(vendor)) await rm(vendor, { recursive: true, force: true });
await mkdir(vendor, { recursive: true });

for (const part of ["css", "themes", "astro"]) {
  await cp(join(KIT, part), join(vendor, part), { recursive: true });
}
await writeFile(
  join(vendor, "README.md"),
  "Vendored from the SEO platform design system.\n\n" +
    "Edit `themes/` freely - that is the skin.\n" +
    "Avoid editing `css/` - re-running the kit's init with --force overwrites it.\n",
);

for (const { path, body } of files) {
  const full = join(dir, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, body);
}

console.log(`\nScaffolded ${pkgName} in ${dir}`);
console.log(`  theme:  ${theme}`);
console.log(`  layers: app (ds-) + marketing (mk-)`);
console.log(`\n  cd ${target}`);
console.log("  npm install");
console.log("  npm run dev\n");

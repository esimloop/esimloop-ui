#!/usr/bin/env node
/**
 * Scaffold a new Astro project wired to this design system.
 *
 *   node bin/init.mjs <target-dir> [--name <pkg-name>] [--theme blank|openseo] [--force]
 *
 * Themes: `blank` (neutral, AA-clean — the default) or `openseo` (the
 * reconstructed values; named for provenance, not for a domain).
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
const VALUE_FLAGS = new Set(["--name", "--theme"]);
const flag = (name, fallback) => {
  const i = argv.indexOf("--" + name);
  return i === -1 ? fallback : argv[i + 1];
};
const has = (name) => argv.includes("--" + name);
const target = argv.find((a, i) => !a.startsWith("--") && !VALUE_FLAGS.has(argv[i - 1]));

if (!target) {
  console.error("Usage: node bin/init.mjs <target-dir> [--name <pkg>] [--theme blank|openseo] [--force]");
  process.exit(1);
}

const dir = resolve(process.cwd(), target);
const pkgName = flag("name", basename(dir));
const theme = flag("theme", "blank");
if (!["openseo", "blank"].includes(theme)) {
  console.error('Unknown theme "' + theme + '". Use "blank" or "openseo".');
  process.exit(1);
}

if (existsSync(dir) && !has("force")) {
  const entries = await readdir(dir);
  if (entries.length) {
    console.error(dir + " is not empty. Re-run with --force to overwrite.");
    process.exit(1);
  }
}

// ------------------------------------------------------------------- files
const file = (path, body) => ({ path, body });

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

  file("tsconfig.json", JSON.stringify({ extends: "astro/tsconfigs/strict" }, null, 2) + "\n"),

  file(".gitignore", "node_modules/\ndist/\n.astro/\n.env\n.DS_Store\n"),

  file(
    "src/styles/app.css",
    `/* Load a THEME first, then the SKELETON. That order is the whole system:
   the skeleton only references tokens, the theme supplies their values.

   To re-skin this project, edit src/design-system/themes/app-${theme}.css
   (and marketing-${theme}.css). Nothing else needs to change. */
@import "../design-system/themes/app-${theme}.css";
@import "../design-system/themes/marketing-${theme}.css";
@import "../design-system/css/index.css";
`,
  ),

  // ------------------------------------------------------------- layouts
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
import MkAnnounce from "../design-system/astro/marketing/MkAnnounce.astro";
import SiteHeader from "../components/SiteHeader.astro";
import SiteFooter from "../components/SiteFooter.astro";

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
    <MkAnnounce tag="New" href="/blog/example-post" linkLabel="Read the post">
      One message at a time - if you have two, you have none.
    </MkAnnounce>
    <SiteHeader />
    <main><slot /></main>
    <SiteFooter />
  </body>
</html>
`,
  ),

  // ---------------------------------------------------------- components
  file(
    "src/components/SiteHeader.astro",
    `---
import MkNav from "../design-system/astro/marketing/MkNav.astro";
---
<MkNav
  brand="Product"
  links={[
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Blog", href: "/blog" },
  ]}
  ctaLabel="Open app"
  ctaHref="/app"
/>
`,
  ),

  file(
    "src/components/SiteFooter.astro",
    `---
import MkFooter from "../design-system/astro/marketing/MkFooter.astro";
---
<MkFooter
  brand="Product"
  blurb="Replace this line with what your product does, in one sentence."
  columns={[
    { label: "Product", links: [{ label: "Features", href: "/#features" }, { label: "Pricing", href: "/pricing" }] },
    { label: "Resources", links: [{ label: "Blog", href: "/blog" }, { label: "Contact", href: "/contact" }] },
    { label: "Company", links: [{ label: "Contact", href: "/contact" }, { label: "Privacy", href: "#" }] },
  ]}
>
  <form slot="newsletter" class="mk-newsletter">
    <input type="email" placeholder="Email address" aria-label="Email address" />
    <button type="submit">Subscribe</button>
  </form>
</MkFooter>
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

// Group by what the data is ABOUT, not by feature area. Keep it flat - the
// sidebar has no nesting and group labels are headings, not toggles.
const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/app", icon: "dashboard", active: active === "dashboard" }],
  },
  {
    label: "Analyse",
    items: [
      { label: "Reports", href: "/app", icon: "trend", active: active === "reports" },
      { label: "Segments", href: "/app", icon: "filters", active: active === "segments" },
      { label: "Sources", href: "/app", icon: "link", active: active === "sources" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Items", href: "/app", icon: "inbox", active: active === "items" },
      { label: "Audit", href: "/app", icon: "audit", active: active === "audit" },
      { label: "Settings", href: "/app", icon: "settings", active: active === "settings" },
    ],
  },
];
---
<Sidebar brand="Product" groups={groups}>
  <button slot="switcher" class="ds-switcher" type="button">
    <span class="ds-switcher__avatar">W</span>
    <span class="ds-switcher__name">Workspace</span>
  </button>
  <a slot="footer" class="ds-navitem" href="/app"><span>Help</span></a>
</Sidebar>
`,
  ),

  // --------------------------------------------------------------- pages
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
import StatStrip from "../design-system/astro/app/StatStrip.astro";

// Example rows, so the first paint shows what the screen does. Replace them.
const rows = [
  { name: "Getting started guide", views: "14,800", score: 24, change: 12, status: "Published" },
  { name: "Pricing page", views: "9,900", score: 41, change: -4, status: "Published" },
  { name: "Integrations overview", views: "22,200", score: 88, change: 2, status: "Draft" },
  { name: "Changelog", views: "3,600", score: null, change: 0, status: "Draft" },
];

const arrow = (n) => (n > 0 ? "\\u25B2" : n < 0 ? "\\u25BC" : "\\u2014");
const deltaClass = (n) =>
  "ds-kpi__delta " + (n > 0 ? "ds-delta--up" : n < 0 ? "ds-delta--down" : "ds-delta--flat");
---
<AppLayout title="Dashboard">
  <AppShell brand="Product">
    <Nav slot="sidebar" active="dashboard" />

    <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;justify-content:space-between">
      <div>
        <h1 class="ds-h1">Dashboard</h1>
        <p class="ds-body ds-text-secondary" style="margin:4px 0 0">
          Example data. Replace it with your own.
        </p>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0">
        <Button size="sm" iconStart="download">Export</Button>
        <Button size="sm" variant="primary" iconStart="plus">New item</Button>
      </div>
    </div>

    <div style="display:grid;gap:16px;grid-template-columns:repeat(2,1fr)">
      <KpiCard label="Total views" value="128.4K" delta={12} deltaLabel="vs. prev. 30d" />
      <KpiCard label="Active items" value="24,180" delta={-3} deltaLabel="vs. prev. 30d" />
      <KpiCard label="Average score" value="38" hint="Lower is better" />
      <KpiCard label="Open issues" value="42" loading />
    </div>

    <StatStrip
      columns={4}
      stats={[
        { label: "Items", value: "318" },
        { label: "Issues", value: "42", sub: "6 critical" },
        { label: "Avg. response", value: "412ms" },
        { label: "Health", value: "94", tone: "success" },
      ]}
    />

    <Card title="Top items" flush>
      <Button slot="actions" size="xs" variant="ghost" iconStart="filters">Filters</Button>
      <div class="ds-table-wrap">
        <table class="ds-table ds-table--sm">
          <thead>
            <tr>
              <th data-col="id">Name</th>
              <th data-align="right">Views</th>
              <th data-align="right">Score</th>
              <th data-align="right">Change</th>
              <th data-align="center">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr>
                <td data-col="id" style="font-weight:500">{r.name}</td>
                <td data-align="right">{r.views}</td>
                <td data-align="right"><Score value={r.score} label={"Score " + (r.score ?? "not available")} /></td>
                <td data-align="right">
                  <span class={deltaClass(r.change)}>{arrow(r.change)} {Math.abs(r.change)}%</span>
                </td>
                <td data-align="center">
                  <Badge tone={r.status === "Published" ? "success" : "neutral"}>{r.status}</Badge>
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
import MkHero from "../design-system/astro/marketing/MkHero.astro";
import MkSection from "../design-system/astro/marketing/MkSection.astro";
import MkHeading from "../design-system/astro/marketing/MkHeading.astro";
import MkSplit from "../design-system/astro/marketing/MkSplit.astro";
import MkButton from "../design-system/astro/marketing/MkButton.astro";
import MkCard from "../design-system/astro/marketing/MkCard.astro";
import MkQuote from "../design-system/astro/marketing/MkQuote.astro";
import MkLogos from "../design-system/astro/marketing/MkLogos.astro";
import MkStats from "../design-system/astro/marketing/MkStats.astro";
import MkCta from "../design-system/astro/marketing/MkCta.astro";
import MkSteps from "../design-system/astro/marketing/MkSteps.astro";
import MkTabs from "../design-system/astro/marketing/MkTabs.astro";
import MkMedia from "../design-system/astro/marketing/MkMedia.astro";
import Icon from "../design-system/astro/app/Icon.astro";

const features = [
  { title: "Fast to start", body: "Everything you need on day one, nothing you have to rip out later.", icon: "dashboard" },
  { title: "Built to read", body: "Dense tables, clear hierarchy, and states that say what happened.", icon: "search" },
  { title: "Yours to shape", body: "One theme file drives every colour, size and radius.", icon: "settings" },
];
---
<MarketingLayout title="Product" description="Replace this description.">
  <MkHero
    layout="split"
    eyebrow="Introducing Product"
    title="Ship your next project without rebuilding the basics."
    subtitle="A complete interface layer for apps and sites, so you start on the work that is actually yours."
    note="No credit card required"
  >
    <MkButton size="lg" variant="primary" href="/app">Start free</MkButton>
    <MkButton size="lg" variant="secondary" href="#features">See features</MkButton>
    <div slot="media" class="mk-mockup">
      <div class="mk-mockup-media" style="aspect-ratio:16/10;display:grid;place-items:center;color:var(--m-ink-tertiary)">
        <Icon name="dashboard" size="xl" />
      </div>
    </div>
  </MkHero>

  <MkSection ground="quiet">
    <p class="mk-body-sm mk-subtle" style="text-align:center;margin:0 0 28px">Trusted by teams at</p>
    <MkLogos items={["Northwind", "Contoso", "Fabrikam", "Adventure", "Litware"]} />
  </MkSection>

  <MkSection id="features">
    <MkHeading
      eyebrow="Everything in one place"
      title="See the whole picture"
      body="Replace this copy. The accent colour appears exactly once on this page, on the one action that matters most."
    />
    <div class="mk-feature-grid">
      {features.map((f) => (
        <MkCard kind="feature" title={f.title} body={f.body} href="#">
          <div slot="media" style="height:120px;display:grid;place-items:center;color:var(--m-ink-tertiary)">
            <Icon name={f.icon} size="xl" />
          </div>
        </MkCard>
      ))}
    </div>
  </MkSection>

  <MkSection ground="warm">
    <MkSplit media="end">
      <MkHeading
        eyebrow="How it works"
        title="One theme file, every screen"
        body="Change four values and the whole interface follows. No component knows a colour."
      />
      <div style="margin-top:24px">
        <MkButton variant="accent" href="/pricing" arrow>See pricing</MkButton>
      </div>
      <div slot="media" class="mk-mockup">
        <div class="mk-mockup-media" style="aspect-ratio:4/3;display:grid;place-items:center;color:var(--m-ink-tertiary)">
          <Icon name="settings" size="xl" />
        </div>
      </div>
    </MkSplit>
  </MkSection>

  <MkSection ground="quiet">
    <MkHeading eyebrow="How it works" title="Three steps" />
    <div style="margin-top:32px">
      <MkSteps
        steps={[
          { title: "Scaffold", body: "One command gives you a project with four working pages." },
          { title: "Re-skin", body: "Change four values in the theme file. Every screen follows." },
          { title: "Ship", body: "Build is static, so it deploys anywhere." },
        ]}
      />
    </div>
  </MkSection>

  <MkSection>
    <MkHeading title="Two layers, one repository" body="Switch between them without leaving the page." />
    <div style="margin-top:24px">
      <MkTabs name="layers" tabs={[{ id: "app", label: "Application" }, { id: "site", label: "Marketing" }]}>
        <div slot="panel-app">
          <p class="mk-body-lg mk-muted" style="max-width:60ch;margin:0 0 20px">
            Dense, flat and border-driven. Light and dark themes.
          </p>
          <MkMedia ratio="16/9"><Icon name="dashboard" size="xl" /></MkMedia>
        </div>
        <div slot="panel-site">
          <p class="mk-body-lg mk-muted" style="max-width:60ch;margin:0 0 20px">
            Warm grounds, editorial type, one accent per page. Light only.
          </p>
          <MkMedia ratio="16/9"><Icon name="globe" size="xl" /></MkMedia>
        </div>
      </MkTabs>
    </div>
  </MkSection>

  <MkSection>
    <MkStats
      stats={[
        { value: "32", label: "Components across two layers" },
        { value: "4", label: "Themes, fully interchangeable" },
        { value: "AA", label: "Contrast, measured not assumed" },
        { value: "0", label: "Runtime dependencies" },
      ]}
    />
  </MkSection>

  <div class="mk-quotes">
    <div class="mk-container">
      <h2 class="mk-display-md" style="text-align:center">What people say</h2>
      <div class="mk-quote-grid">
        <MkQuote quote="Replace with a real quote from a real person." name="A. Rivera" meta="Head of growth" initials="AR" />
        <MkQuote quote="Replace with a real quote from a real person." name="S. Moreau" meta="Founder" initials="SM" />
        <MkQuote quote="Replace with a real quote from a real person." name="T. Lambert" meta="Consultant" initials="TL" />
      </div>
    </div>
  </div>

  <MkSection>
    <MkCta title="Start building today" body="Scaffold a project in one command and keep every screen consistent from the first commit.">
      <MkButton size="lg" variant="primary" href="/app">Start free</MkButton>
      <MkButton size="lg" variant="secondary" href="/pricing">See pricing</MkButton>
    </MkCta>
  </MkSection>
</MarketingLayout>
`,
  ),

  file(
    "src/pages/pricing.astro",
    `---
import MarketingLayout from "../layouts/MarketingLayout.astro";
import MkSection from "../design-system/astro/marketing/MkSection.astro";
import MkHeading from "../design-system/astro/marketing/MkHeading.astro";
import MkBreadcrumb from "../design-system/astro/marketing/MkBreadcrumb.astro";
import MkPricing from "../design-system/astro/marketing/MkPricing.astro";
import MkCompare from "../design-system/astro/marketing/MkCompare.astro";
import MkFaq from "../design-system/astro/marketing/MkFaq.astro";
import MkCta from "../design-system/astro/marketing/MkCta.astro";
import MkButton from "../design-system/astro/marketing/MkButton.astro";
---
<MarketingLayout title="Pricing" description="Replace this description.">
  <MkSection>
    <MkBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Pricing" }]} />
    <div style="margin-top:24px">
      <MkHeading
        align="center"
        size="lg"
        title="Simple pricing"
        body="Replace these plans. At most one card is featured - a second cancels the emphasis of the first."
      />
    </div>
    <div style="margin-top:40px">
      <MkPricing
        plans={[
          {
            name: "Starter",
            amount: "Free",
            blurb: "For a first project.",
            features: ["1 workspace", "Community support", "Core components"],
            ctaLabel: "Start free",
            ctaHref: "/app",
          },
          {
            name: "Team",
            amount: "$29",
            period: "/ month",
            blurb: "For small teams shipping regularly.",
            features: ["Unlimited workspaces", "Email support", "All components", "Custom themes"],
            ctaLabel: "Start free trial",
            ctaHref: "/app",
            featured: true,
            tag: "Popular",
          },
          {
            name: "Business",
            amount: "$99",
            period: "/ month",
            blurb: "For organisations with many projects.",
            features: ["Everything in Team", "Priority support", "SSO", "Audit log"],
            ctaLabel: "Contact sales",
            ctaHref: "#",
          },
        ]}
      />
    </div>
  </MkSection>

  <MkSection ground="quiet">
    <MkHeading title="Compare plans" body="Every row is a real difference between the plans." />
    <div style="margin-top:28px">
      <MkCompare
        rowHeader="Feature"
        columns={["Starter", "Team", "Business"]}
        rows={[
          { label: "Workspaces", values: ["1", "Unlimited", "Unlimited"] },
          { label: "Components", values: ["Core", true, true] },
          { label: "Custom themes", values: [false, true, true] },
          { label: "Priority support", values: [false, false, true] },
          { label: "SSO", values: [false, false, true] },
        ]}
      />
    </div>
  </MkSection>

  <MkSection>
    <div class="mk-narrow">
      <MkHeading title="Questions" />
      <div style="margin-top:24px">
        <MkFaq
          items={[
            { q: "Can I change plans later?", a: "Yes. Changes take effect at the start of the next billing period, and you are only charged the difference." },
            { q: "What happens when a trial ends?", a: "The workspace stays, and it drops to the Starter plan. Nothing is deleted." },
            { q: "Do you offer refunds?", a: "Within 30 days, for any reason. Write to us and we process it the same week." },
          ]}
        />
      </div>
    </div>
  </MkSection>

  <MkSection ground="warm">
    <MkCta title="Still deciding?" body="Start on the free plan and upgrade when the team grows.">
      <MkButton size="lg" variant="primary" href="/app">Start free</MkButton>
    </MkCta>
  </MkSection>
</MarketingLayout>
`,
  ),

  file(
    "src/pages/blog/index.astro",
    `---
import MarketingLayout from "../../layouts/MarketingLayout.astro";
import MkSection from "../../design-system/astro/marketing/MkSection.astro";
import MkHeading from "../../design-system/astro/marketing/MkHeading.astro";
import MkBreadcrumb from "../../design-system/astro/marketing/MkBreadcrumb.astro";
import MkArticleCard from "../../design-system/astro/marketing/MkArticleCard.astro";

const posts = [
  { title: "How we keep two design systems from drifting", excerpt: "A token contract, checked in CI.", category: "Engineering", date: "12 Mar", readingTime: "6 min", href: "/blog/example-post" },
  { title: "Density is a feature, not a setting", excerpt: "Why the tables are 12px and stay that way.", category: "Design", date: "4 Mar", readingTime: "4 min", href: "/blog/example-post" },
  { title: "Measuring contrast instead of assuming it", excerpt: "Every pair in the palette, with its ratio.", category: "Accessibility", date: "26 Feb", readingTime: "8 min", href: "/blog/example-post" },
  { title: "One accent, used once", excerpt: "What happens when a page has two calls to action.", category: "Design", date: "18 Feb", readingTime: "3 min", href: "/blog/example-post" },
  { title: "Shipping a marketing site from the same repo", excerpt: "Two layers, namespaced, no collisions.", category: "Engineering", date: "9 Feb", readingTime: "7 min", href: "/blog/example-post" },
  { title: "Why the sidebar does not collapse", excerpt: "A rail you cannot read is not a feature.", category: "Design", date: "1 Feb", readingTime: "5 min", href: "/blog/example-post" },
];
---
<MarketingLayout title="Blog" description="Replace this description.">
  <MkSection>
    <MkBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
    <div style="margin-top:24px">
      <MkHeading size="lg" title="Writing" body="Replace these posts with your own." />
    </div>
    <div class="mk-article-grid">
      {posts.map((post) => (
        <MkArticleCard
          title={post.title}
          excerpt={post.excerpt}
          href={post.href}
          category={post.category}
          date={post.date}
          readingTime={post.readingTime}
        />
      ))}
    </div>
  </MkSection>
</MarketingLayout>
`,
  ),

  file(
    "src/pages/blog/example-post.astro",
    `---
import MarketingLayout from "../../layouts/MarketingLayout.astro";
import MkSection from "../../design-system/astro/marketing/MkSection.astro";
import MkBreadcrumb from "../../design-system/astro/marketing/MkBreadcrumb.astro";
import MkArticleHeader from "../../design-system/astro/marketing/MkArticleHeader.astro";
import MkAuthor from "../../design-system/astro/marketing/MkAuthor.astro";
import MkProse from "../../design-system/astro/marketing/MkProse.astro";
import MkToc from "../../design-system/astro/marketing/MkToc.astro";
import MkCallout from "../../design-system/astro/marketing/MkCallout.astro";
import MkPostNav from "../../design-system/astro/marketing/MkPostNav.astro";
import MkMedia from "../../design-system/astro/marketing/MkMedia.astro";
import Icon from "../../design-system/astro/app/Icon.astro";

// The ids here must match the heading ids in the prose below.
const toc = [
  { id: "the-problem", label: "The problem" },
  { id: "the-contract", label: "The contract" },
  { id: "what-it-catches", label: "What it catches", depth: 3 },
  { id: "results", label: "Results" },
];
---
<MarketingLayout title="How we keep two design systems from drifting">
  <MkSection>
    <MkBreadcrumb
      items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: "Article" }]}
    />

    <div style="margin-top:32px">
      <MkArticleHeader
        category="Engineering"
        date="12 March 2026"
        readingTime="6 min read"
        title="How we keep two design systems from drifting"
        standfirst="Running an app system and a marketing system side by side only works if something fails the build when they diverge."
      >
        <div style="margin-top:28px">
          <MkAuthor name="A. Rivera" role="Design engineering" initials="AR" />
        </div>
      </MkArticleHeader>
    </div>

    <div style="margin-top:40px">
      <MkMedia ratio="16/9"><Icon name="dashboard" size="xl" /></MkMedia>
    </div>

    <div class="mk-article-layout" style="margin-top:48px">
      <div>
        <MkProse>
          <p>
            Replace this article with your own. Everything inside this block is plain
            HTML, so markdown output drops straight in without a single class.
          </p>

          <h2 id="the-problem">The problem</h2>
          <p>
            Two systems in one repository will converge by accident. Someone needs a
            colour in a hurry, hard-codes it in a component, and the theme file stops
            being the single source of truth. Nothing breaks that day; it breaks three
            projects later.
          </p>
          <blockquote>
            <p>A rule that nothing enforces is a preference, and preferences drift.</p>
          </blockquote>

          <h2 id="the-contract">The contract</h2>
          <p>
            The skeleton may only <em>reference</em> tokens. The themes may only
            <em>declare</em> them. Two rules, both machine-checkable:
          </p>
          <ul>
            <li>no <code>--token:</code> declaration in <code>css/</code></li>
            <li>no colour literal in <code>css/</code>, except pure black and white</li>
            <li>every theme declares exactly the same token set</li>
          </ul>

          <MkCallout label="Note" icon="info">
            <p>
              The third rule is the one that matters most. Without it a theme can
              satisfy the skeleton while quietly missing a token another theme has,
              and the two stop being interchangeable.
            </p>
          </MkCallout>

          <h3 id="what-it-catches">What it catches</h3>
          <p>Running it for the first time found two real faults:</p>
          <pre><code>FAIL themes/app-blank.css is missing: --t-h1-ls, --t-h1-w, ...
FAIL css/marketing.css hard-codes colours: #b91c1c</code></pre>
          <p>
            Both were mine, both were minutes old, and neither would have been visible
            in a screenshot.
          </p>

          <h2 id="results">Results</h2>
          <table>
            <thead>
              <tr><th>Check</th><th>Before</th><th>After</th></tr>
            </thead>
            <tbody>
              <tr><td>Token drift</td><td>Manual review</td><td>Fails the build</td></tr>
              <tr><td>Hard-coded colours</td><td>Unnoticed</td><td>Fails the build</td></tr>
              <tr><td>Theme swap</td><td>Hopeful</td><td>Guaranteed</td></tr>
            </tbody>
          </table>
          <p>
            The guard runs in under a second, which is the only reason anyone keeps
            running it.
          </p>
        </MkProse>

        <div style="margin-top:56px">
          <MkPostNav
            previous={{ title: "Density is a feature, not a setting", href: "/blog/example-post" }}
            next={{ title: "One accent, used once", href: "/blog/example-post" }}
          />
        </div>
      </div>

      <aside class="mk-article-layout__aside">
        <MkToc items={toc} />
      </aside>
    </div>
  </MkSection>
</MarketingLayout>
`,
  ),

  file(
    "src/pages/contact.astro",
    `---
import MarketingLayout from "../layouts/MarketingLayout.astro";
import MkSection from "../design-system/astro/marketing/MkSection.astro";
import MkHeading from "../design-system/astro/marketing/MkHeading.astro";
import MkBreadcrumb from "../design-system/astro/marketing/MkBreadcrumb.astro";
import MkField from "../design-system/astro/marketing/MkField.astro";
import MkButton from "../design-system/astro/marketing/MkButton.astro";
import MkTeam from "../design-system/astro/marketing/MkTeam.astro";
---
<MarketingLayout title="Contact" description="Replace this description.">
  <MkSection>
    <MkBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
    <div style="margin-top:24px">
      <MkHeading size="lg" title="Get in touch" body="We read everything and reply within two working days." />
    </div>

    <form class="mk-form" style="margin-top:40px" method="post" action="#">
      <MkField label="Name" id="name" required>
        <input class="mk-input" id="name" name="name" type="text" required autocomplete="name" />
      </MkField>

      <MkField label="Email" id="email" required hint="We only use this to reply.">
        <input class="mk-input" id="email" name="email" type="email" required
               autocomplete="email" aria-describedby="email-hint" />
      </MkField>

      <MkField label="Subject" id="subject">
        <select class="mk-select" id="subject" name="subject">
          <option>General question</option>
          <option>Sales</option>
          <option>Support</option>
        </select>
      </MkField>

      <MkField label="Message" id="message" required>
        <textarea class="mk-textarea" id="message" name="message" required
                  placeholder="What can we help with?"></textarea>
      </MkField>

      <div><MkButton variant="primary">Send message</MkButton></div>
    </form>
  </MkSection>

  <MkSection ground="quiet">
    <MkHeading title="The team" body="Replace these people with yours." />
    <div style="margin-top:32px">
      <MkTeam
        people={[
          { name: "A. Rivera", role: "Design engineering", initials: "AR" },
          { name: "S. Moreau", role: "Founder", initials: "SM" },
          { name: "T. Lambert", role: "Support", initials: "TL" },
          { name: "J. Okafor", role: "Operations", initials: "JO" },
        ]}
      />
    </div>
  </MkSection>
</MarketingLayout>
`,
  ),

  file(
    "src/pages/404.astro",
    `---
import MarketingLayout from "../layouts/MarketingLayout.astro";
import MkSection from "../design-system/astro/marketing/MkSection.astro";
import MkButton from "../design-system/astro/marketing/MkButton.astro";
---
<MarketingLayout title="Page not found">
  <MkSection>
    <div class="mk-narrow" style="text-align:center">
      <p class="mk-eyebrow">404</p>
      <h1 class="mk-display-lg">We could not find that page.</h1>
      <p class="mk-subhead mk-muted" style="margin-top:16px">
        It may have moved, or the link may be wrong. The homepage is a good place to restart.
      </p>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:32px">
        <MkButton variant="primary" href="/">Go home</MkButton>
        <MkButton variant="secondary" href="/blog">Read the blog</MkButton>
      </div>
    </div>
  </MkSection>
</MarketingLayout>
`,
  ),

  file(
    "README.md",
    `# ${pkgName}

Scaffolded from esimloop-ui, theme **${theme}**.

    npm install
    npm run dev

## Pages

| Route | Layer | Exercises |
| --- | --- | --- |
| \`/\` | marketing | announce bar, hero (split), logos, features, split, steps, tabs, stats, quotes, CTA |
| \`/pricing\` | marketing | pricing, comparison table, FAQ, breadcrumb |
| \`/blog\` | marketing | article grid, breadcrumb |
| \`/blog/example-post\` | marketing | prose, article header, author, table of contents, callout, post nav |
| \`/contact\` | marketing | form fields, team grid |
| \`/404\` | marketing | not-found pattern |
| \`/app\` | application | shell, sidebar, KPIs, stat strip, data table |

## Where things live

| Path | What it is |
| --- | --- |
| \`src/design-system/themes/\` | **The skin — edit this.** \`app-${theme}.css\` and \`marketing-${theme}.css\` hold every colour, size and radius. |
| \`src/design-system/css/\` | The skeleton. Components reference tokens and never hard-code a value — leave it alone. |
| \`src/design-system/astro/\` | Components for both layers. |
| \`src/styles/app.css\` | Loads the theme, then the skeleton. That order matters. |

## Two layers

- **App** (\`ds-\`) — dense, flat, border-driven. Light and dark.
- **Marketing** (\`mk-\`) — warm, editorial, one accent per page. Light only.

They share a typeface and nothing else. Don't mix their classes on one page.

## Re-skinning

Open the theme file and change four things: \`--accent\` (keep it at 4.5:1 or
better against \`--surface-card\`), \`--content\`, the surface ramp, and
\`--font-sans\`. Everything else derives.
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
  "Vendored from esimloop-ui.\n\n" +
    "Edit `themes/` freely - that is the skin.\n" +
    "Avoid editing `css/` - re-running init with --force overwrites it.\n",
);

for (const { path, body } of files) {
  const full = join(dir, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, body);
}

console.log("\nScaffolded " + pkgName + " in " + dir);
console.log("  theme:  " + theme);
console.log("  layers: app (ds-) + marketing (mk-)");
console.log("  pages:  / · /pricing · /blog · /blog/example-post · /contact · /404 · /app");
console.log("\n  cd " + target);
console.log("  npm install");
console.log("  npm run dev\n");

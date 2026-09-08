#!/usr/bin/env node
/**
 * Contract guard.
 *
 * The skeleton (css/*.css) may only reference tokens; the skins (themes/*.css)
 * must all declare the same set. This script fails the build when either rule
 * breaks, which is what keeps themes swappable.
 *
 * Run: npm run check
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

/** Set on the component itself with a fallback, so a theme never declares it. */
const COMPONENT_LOCAL = new Set(["--btn-bg", "--btn-border", "--btn-fg", "--ring"]);

// A declaration, not a BEM modifier: `.ds-btn--primary:hover` must not match,
// so the `--` may not follow a word character, a dot or a hyphen.
const declared = (src) =>
  new Set([...src.matchAll(/(?<![\w.-])(--[\w-]+)\s*:/g)].map((m) => m[1]));
const referenced = (src) =>
  new Set(
    [...src.matchAll(/var\(\s*(--[\w-]+)/g)]
      .map((m) => m[1])
      .filter((t) => !COMPONENT_LOCAL.has(t)),
  );

const LAYERS = [
  {
    name: "app",
    skeleton: "css/system.css",
    themes: ["themes/app-openseo.css", "themes/app-blank.css"],
  },
  {
    name: "marketing",
    skeleton: "css/marketing.css",
    themes: ["themes/marketing-openseo.css", "themes/marketing-blank.css"],
  },
];

let failed = false;
const fail = (msg) => {
  failed = true;
  console.error("  FAIL " + msg);
};

for (const layer of LAYERS) {
  console.log(`\n${layer.name}`);
  const skeletonSrc = read(layer.skeleton);
  const needs = referenced(skeletonSrc);

  // 1. The skeleton must not declare theme tokens of its own.
  const selfDeclared = [...declared(skeletonSrc)].filter((t) => !COMPONENT_LOCAL.has(t));
  if (selfDeclared.length) {
    fail(`${layer.skeleton} declares tokens (skeletons only reference them): ${selfDeclared.join(", ")}`);
  } else {
    console.log(`  ok   ${layer.skeleton} declares no tokens (references ${needs.size})`);
  }

  // 2. Every theme must satisfy the skeleton.
  const sets = layer.themes.map((t) => [t, declared(read(t))]);
  for (const [name, set] of sets) {
    const missing = [...needs].filter((t) => !set.has(t)).sort();
    if (missing.length) fail(`${name} is missing: ${missing.join(", ")}`);
    else console.log(`  ok   ${name} satisfies the skeleton (${set.size} tokens)`);
  }

  // 3. Every theme must declare the same set, so they are swappable.
  const [[firstName, firstSet], ...rest] = sets;
  for (const [name, set] of rest) {
    const drift = [...new Set([...firstSet, ...set])]
      .filter((t) => firstSet.has(t) !== set.has(t))
      .sort();
    if (drift.length) fail(`${name} drifts from ${firstName}: ${drift.join(", ")}`);
    else console.log(`  ok   ${name} matches ${firstName} exactly`);
  }
}

console.log("");
if (failed) {
  console.error("Token contract broken.");
  process.exit(1);
}
console.log("Token contract intact - themes are interchangeable.");

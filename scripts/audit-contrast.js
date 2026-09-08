/**
 * Contrast audit — paste into the browser console on any page of the kit.
 *
 *   const failures = auditContrast();
 *   console.table(failures);
 *
 * Why this exists: the token guard (`npm run check`) proves the skeleton reads
 * tokens and that the themes agree. It cannot tell you whether the result is
 * READABLE — those are different questions. A reference page once shipped with
 * near-black text on the app's near-black surface inside a permanently light
 * marketing island, and every automated check passed. This is the check that
 * catches that class of fault.
 *
 * What it does that a naive check does not:
 *   - resolves oklab() and oklch(), which is what color-mix() computes to, so
 *     the whole token system is measurable rather than opaque;
 *   - composites translucent text over the real stack of ancestor backgrounds,
 *     because every text tier here is the ink at an opacity;
 *   - applies the WCAG large-text threshold (3:1 at >=24px, or >=18.66px bold).
 *
 * Run it in BOTH themes. Toggling `data-theme` alone is not always enough in a
 * background tab — force a recalc first:
 *
 *   const r = document.documentElement;
 *   r.setAttribute('data-theme', 'dark');
 *   r.style.display = 'none'; void r.offsetHeight; r.style.display = '';
 *
 * Expected result on /design-system: exactly two rows in light and one in dark,
 * all of them the tier sample rows the page deliberately renders in
 * --text-subtle and --text-faint, labelled "large only" and "never text".
 * Anything else is a real fault.
 */
function auditContrast({ threshold = 1 } = {}) {
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const encode = (x) => {
    x = clamp(x);
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };

  function oklabToRgb(L, a, b, alpha) {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return {
      r: encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s) * 255,
      g: encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s) * 255,
      b: encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s) * 255,
      a: alpha,
    };
  }

  function parse(colour) {
    if (!colour || colour === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
    let m = colour.match(/^rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
    }
    m = colour.match(/^oklab\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[\s/]+/).filter(Boolean).map(parseFloat);
      return oklabToRgb(p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]);
    }
    m = colour.match(/^oklch\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[\s/]+/).filter(Boolean).map(parseFloat);
      const h = (p[2] * Math.PI) / 180;
      return oklabToRgb(p[0], p[1] * Math.cos(h), p[1] * Math.sin(h), p[3] === undefined ? 1 : p[3]);
    }
    return null;
  }

  const over = (f, b) => ({
    r: f.r * f.a + b.r * (1 - f.a),
    g: f.g * f.a + b.g * (1 - f.a),
    b: f.b * f.a + b.b * (1 - f.a),
    a: 1,
  });
  const luminance = (c) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => {
    const [l1, l2] = [luminance(a), luminance(b)];
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  // Walk up compositing every translucent background, ending on the root.
  function backgroundOf(element) {
    const chain = [];
    for (let n = element; n && n !== document.documentElement; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) chain.push(c);
    }
    const root = parse(getComputedStyle(document.documentElement).backgroundColor);
    if (root && root.a > 0) chain.push(root);

    let acc = chain.length ? { ...chain[chain.length - 1], a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
    for (let i = chain.length - 2; i >= 0; i--) acc = over(chain[i], acc);
    return acc;
  }

  const failures = [];
  document.querySelectorAll("body *").forEach((el) => {
    if (el.closest("[hidden]") || el.getAttribute("aria-hidden") === "true") return;

    // Only elements holding their OWN text: otherwise a wrapper is blamed for
    // the colour of a child that sets its own.
    const text = [...el.childNodes]
      .filter((n) => n.nodeType === 3 && n.textContent.trim())
      .map((n) => n.textContent.trim())
      .join(" ");
    if (!text) return;

    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none" || parseFloat(style.opacity) < 0.1) return;
    const box = el.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return;

    const fg = parse(style.color);
    if (!fg) return;
    const bg = backgroundOf(el);
    const effective = fg.a < 1 ? over(fg, bg) : fg;

    const size = parseFloat(style.fontSize);
    const weight = parseInt(style.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const required = large ? 3 : 4.5;
    const measured = ratio(effective, bg);

    if (measured < required * threshold) {
      failures.push({
        selector:
          el.tagName.toLowerCase() +
          (typeof el.className === "string" && el.className.trim()
            ? "." + el.className.trim().split(/\s+/)[0]
            : ""),
        text: text.slice(0, 40),
        ratio: +measured.toFixed(2),
        required,
        size: Math.round(size),
      });
    }
  });

  return failures.sort((a, b) => a.ratio - b.ratio);
}

if (typeof window !== "undefined") window.auditContrast = auditContrast;

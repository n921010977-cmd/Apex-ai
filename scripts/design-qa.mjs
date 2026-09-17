#!/usr/bin/env node
// ─── Design QA sweep ──────────────────────────────────────────────────────────
// Drives the running app across the project's breakpoint matrix and reports the
// defects that are cheap to miss by eye: horizontal overflow, elements poking
// outside the viewport, clipped text, and accessibility violations.
//
//   npm run dev                      # in another terminal
//   npm run qa:design                # sweep "/"
//   npm run qa:design -- /pricing /dashboard/billing
//
// Screenshots land in .design-qa/. Exits non-zero if anything fails, so it can
// gate a commit. It does not judge taste — look at the screenshots for that.

import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

// Some environments ship a preinstalled Chromium whose build number won't match
// the one this Playwright expects. Use it when it's there; otherwise fall back
// to Playwright's own resolution (the normal case after `npx playwright install`).
const PINNED_CHROMIUM = "/opt/pw-browsers/chromium";
const launchOptions = existsSync(PINNED_CHROMIUM) ? { executablePath: PINNED_CHROMIUM } : {};

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const OUT = ".design-qa";

// The breakpoint matrix this project commits to (see the vertlix-responsive skill).
const VIEWPORTS = [
  { name: "390",  width: 390,  height: 844,  mobile: true },
  { name: "430",  width: 430,  height: 932,  mobile: true },
  { name: "768",  width: 768,  height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
];

// Settle time for entrance animations + the analyzing→complete status switch.
const SETTLE_MS = 3200;

/**
 * Elements that extend past the viewport's right edge AND are not clipped by an
 * ancestor. Decorative layers (glows, grids, vignettes) are excluded: they are
 * aria-hidden and deliberately oversized inside an overflow:hidden section, so
 * flagging them buries the real defects.
 */
function findOverflowing() {
  const vw = document.documentElement.clientWidth;
  const bad = [];

  const clippedByAncestor = (el, right) => {
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.overflowX === "hidden" || ps.overflowX === "clip" || ps.overflow === "hidden" || ps.overflow === "clip") {
        if (right > p.getBoundingClientRect().right - 1) return true; // cut off here, never painted
      }
    }
    return false;
  };

  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest('[aria-hidden="true"]')) continue; // decoration, not content
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.opacity === "0" || style.position === "fixed") continue;

    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right <= vw + 1 || r.left >= vw) continue;
    if (clippedByAncestor(el, r.right)) continue;

    bad.push({
      tag: el.tagName.toLowerCase(),
      cls: (typeof el.className === "string" ? el.className : "").trim().slice(0, 60) || "(no class)",
      overhang: Math.round(r.right - vw),
    });
  }
  return bad.slice(0, 8);
}

/** Text boxes whose content is taller/wider than the box — i.e. visually clipped. */
function findClipped() {
  const bad = [];
  for (const el of document.body.querySelectorAll("p, h1, h2, h3, h4, span, a, button, li")) {
    const style = getComputedStyle(el);
    if (style.overflow === "visible" || style.display === "none") continue;
    if (el.scrollHeight > el.clientHeight + 2 && style.overflowY === "hidden") {
      bad.push({ tag: el.tagName.toLowerCase(), text: (el.textContent ?? "").trim().slice(0, 40) });
    }
  }
  return bad.slice(0, 6);
}

async function sweep(browser, path) {
  const slug = path.replace(/\W+/g, "_") || "root";
  const rows = [];
  let failures = 0;

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.mobile ? 3 : 1, // retina check on phones
      isMobile: Boolean(vp.mobile),
      hasTouch: Boolean(vp.mobile),
    });
    const page = await ctx.newPage();

    // Dev-server noise that never reaches production: Turbopack's eval under our
    // CSP, and the Vercel Analytics debug script the same CSP blocks locally.
    const DEV_NOISE = /eval\(\) is not supported|va\.vercel-scripts\.com|script\.debug\.js/i;
    const consoleErrors = [];
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      if (!DEV_NOISE.test(t)) consoleErrors.push(t.slice(0, 120));
    });

    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.locator("button", { hasText: /^Accept$/ }).first().click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(SETTLE_MS);

    const metrics = await page.evaluate(() => ({
      docW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
    }));
    const overflowing = await page.evaluate(findOverflowing);
    const clipped = await page.evaluate(findClipped);

    const hScroll = metrics.docW > metrics.winW;
    await page.screenshot({ path: `${OUT}/${slug}-${vp.name}.png`, fullPage: false });

    // Axe once per page, at the widest viewport — violations rarely differ by width,
    // and running it seven times triples the sweep's runtime for little gain.
    let a11y = [];
    if (vp.name === "1440") {
      const res = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      a11y = res.violations.map((v) => `${v.id} (${v.nodes.length})`);
    }

    const problems = [];
    if (hScroll) problems.push(`h-scroll +${metrics.docW - metrics.winW}px`);
    if (overflowing.length) problems.push(`${overflowing.length} overflowing`);
    if (clipped.length) problems.push(`${clipped.length} clipped`);
    if (a11y.length) problems.push(`a11y: ${a11y.join(", ")}`);
    if (consoleErrors.length) problems.push(`${consoleErrors.length} console errors`);
    if (problems.length) failures++;

    rows.push({ vp: vp.name, status: problems.length ? "FAIL" : "ok", problems, overflowing, clipped, consoleErrors });
    await ctx.close();
  }

  console.log(`\n${"═".repeat(72)}\n  ${path}\n${"═".repeat(72)}`);
  for (const r of rows) {
    console.log(`  ${r.status === "ok" ? "✓" : "✗"} ${r.vp.padEnd(6)} ${r.status === "ok" ? "clean" : r.problems.join(" · ")}`);
    for (const o of r.overflowing) console.log(`        ↳ <${o.tag}> ${o.cls} overhangs ${o.overhang}px`);
    for (const c of r.clipped) console.log(`        ↳ clipped <${c.tag}> "${c.text}"`);
    for (const e of r.consoleErrors.slice(0, 3)) console.log(`        ↳ console: ${e}`);
  }
  return failures;
}

const paths = process.argv.slice(2).length ? process.argv.slice(2) : ["/"];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch(launchOptions);
let failures = 0;
try {
  for (const p of paths) failures += await sweep(browser, p);
} finally {
  await browser.close();
}

console.log(`\nScreenshots: ${OUT}/  —  review them, the checks above only catch mechanical faults.\n`);
process.exit(failures ? 1 : 0);

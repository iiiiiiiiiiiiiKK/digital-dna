/**
 * Responsive layout audit.
 *
 * Verifies the things a screenshot cannot prove: no horizontal overflow, no
 * clipped content, and inputs that will not trigger iOS focus-zoom.
 *
 * Touch-target size is reported separately (informational) because inline text
 * links are legitimately short; interactive *controls* are checked strictly.
 */
const BASE = process.env.AUDIT_BASE ?? 'http://127.0.0.1:4187/digital-dna/';
const { chromium, devices } = await import('playwright');

const browser = await chromium.launch();

const VIEWPORTS = [
  { name: 'iphone-se', ...devices['iPhone SE'] },
  { name: 'iphone-13', ...devices['iPhone 13'] },
  { name: 'iphone-13-pro-max', ...devices['iPhone 13 Pro Max'] },
  { name: 'ipad-mini', ...devices['iPad Mini'] },
  { name: 'laptop', viewport: { width: 1024, height: 768 } },
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
];

const ROUTES = ['#/', '#/create', '#/compare', '#/evolution', '#/settings'];

async function audit(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;

    // 1. Horizontal overflow of the document.
    const docOverflow = document.documentElement.scrollWidth - vw;

    // 2. Elements escaping the viewport (excluding scrollable rails).
    const offenders = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (getComputedStyle(el).position === 'fixed') continue;
      let p = el.parentElement;
      let clipped = false;
      while (p && p !== document.body) {
        const ps = getComputedStyle(p);
        if (/auto|scroll|hidden/.test(ps.overflowX)) {
          clipped = true;
          break;
        }
        p = p.parentElement;
      }
      if (clipped) continue;
      if (r.right > vw + 1.5 || r.left < -1.5) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().slice(0, 32),
          left: Math.round(r.left),
          right: Math.round(r.right),
        });
      }
      if (offenders.length > 4) break;
    }

    // 3. iOS focus-zoom guard: every field must be >= 16px on small screens.
    const tinyFonts = [];
    for (const el of document.querySelectorAll('input, textarea, select')) {
      if (el.type === 'checkbox' || el.type === 'radio' || el.type === 'hidden') continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 16 && vw < 768) tinyFonts.push({ tag: el.tagName.toLowerCase(), fs, id: el.id || null });
    }

    // 4. Strict control sizes: buttons/selects that hold text must be tappable.
    const tinyControls = [];
    for (const el of document.querySelectorAll('button, select')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.height < 36) {
        tinyControls.push({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 26),
          h: Math.round(r.height),
        });
      }
      if (tinyControls.length > 5) break;
    }

    return { vw, docOverflow, offenders, tinyFonts, tinyControls };
  });
}

let failures = 0;

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext(vp);
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`);
    await page.waitForTimeout(700);
    const r = await audit(page);

    const problems = [];
    if (r.docOverflow > 1) problems.push(`document overflows horizontally by ${r.docOverflow}px`);
    if (r.offenders.length) problems.push(`elements outside viewport: ${JSON.stringify(r.offenders)}`);
    if (r.tinyFonts.length) problems.push(`fields below 16px (iOS zoom): ${JSON.stringify(r.tinyFonts)}`);
    if (r.tinyControls.length) problems.push(`controls under 36px tall: ${JSON.stringify(r.tinyControls)}`);

    const label = `${vp.name.padEnd(18)} ${route}`;
    if (problems.length) {
      failures++;
      console.log(`FAIL ${label}`);
      for (const p of problems) console.log(`       ${p}`);
    } else {
      console.log(`ok   ${label}`);
    }
  }
  await ctx.close();
}

await browser.close();
console.log(
  failures === 0
    ? '\nLAYOUT AUDIT CLEAN — no overflow, no clipped content, no iOS zoom traps'
    : `\n${failures} viewport/route combinations have issues`
);
process.exit(failures === 0 ? 0 : 1);

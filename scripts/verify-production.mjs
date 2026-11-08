import { chromium, devices } from 'playwright';

/**
 * Production acceptance test against the real GitHub Pages deployment.
 *
 * This is the final gate: it must pass on the live URL, not on a local build.
 */
const LIVE = 'https://iiiiiiiiiiiiiKK.github.io/digital-dna/';
const browser = await chromium.launch();
const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

// ---------------------------------------------------------------- desktop
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

// 1. Load
try {
  const resp = await page.goto(LIVE, { waitUntil: 'networkidle', timeout: 60000 });
  record('HTTP 200 on live URL', resp?.status() === 200, `status ${resp?.status()}`);
  await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 20000 });
  const h1 = await page.getByRole('heading', { level: 1 }).innerText();
  record('Hero headline renders', h1.includes('Your Digital DNA'), h1.replace(/\n/g, ' '));
} catch (e) {
  record('Landing page load', false, e.message.slice(0, 100));
}

// 2. Author X link
const xLink = page.locator('header a[href="https://x.com/0xkillcoin"]').first();
const xVisible = await xLink.isVisible().catch(() => false);
const xTarget = await xLink.getAttribute('target').catch(() => null);
record('Author X link in header', xVisible && xTarget === '_blank', `href verified, target=${xTarget}`);
const xCount = await page.locator('a[href="https://x.com/0xkillcoin"]').count();
record('Author X link appears in multiple places', xCount >= 2, `${xCount} occurrences`);

// 3. Real helix
const strandCount = await page.locator('main svg[role="img"] path[data-part="strand-a"]').count();
const d = await page.locator('main svg[role="img"] path[data-part="strand-a"]').first().getAttribute('d').catch(() => '');
record('Live SVG helix has real path data', strandCount > 0 && (d ?? '').split('C').length > 50, `${(d ?? '').length} chars`);

// 4. Full create flow on production
async function completeWizard(nick) {
  await page.goto(`${LIVE}#/create`);
  await page.getByRole('heading', { name: /Identity/i }).first().waitFor({ timeout: 20000 });
  await page.getByLabel(/Nickname/i).fill(nick);
  await page.getByRole('button', { name: /Continue/i }).click();
  await page.getByText(/Pick your domains/i).first().waitFor();
  await page.getByRole('button', { name: 'AI', exact: true }).click();
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await page.getByRole('button', { name: /Continue/i }).click();
  await page.getByRole('button', { name: 'Programming', exact: true }).click();
  await page.getByRole('button', { name: /Continue/i }).click();
  await page.getByRole('button', { name: /Systems/i }).first().click();
  await page.getByRole('button', { name: /Continue/i }).click();
  await page.getByRole('button', { name: 'GitHub', exact: true }).click();
  await page.getByRole('button', { name: /Continue/i }).click();
  await page.getByRole('button', { name: /Cyberpunk/i }).first().click();
  await page.getByRole('button', { name: /Continue/i }).click();
  await page.getByRole('button', { name: /Generate my DNA/i }).click();
  await page.getByText(/^DNA-[0-9A-F]{6}$/).first().waitFor({ timeout: 30000 });
  return (await page.getByText(/^DNA-[0-9A-F]{6}$/).first().innerText()).trim();
}

let code = '';
try {
  code = await completeWizard('Production Check');
  record('Create DNA on production', /^DNA-[0-9A-F]{6}$/.test(code), code);
} catch (e) {
  record('Create DNA on production', false, e.message.slice(0, 120));
}

// 5. Charts
const svgCount = await page.locator('main svg').count();
record('All visualisations render', svgCount >= 4, `${svgCount} SVGs`);

// 6. Persistence across reload
try {
  await page.reload();
  await page.goto(`${LIVE}#/dna`);
  await page.getByText(code).first().waitFor({ timeout: 20000 });
  record('Data persists after reload (IndexedDB)', true, code);
} catch (e) {
  record('Data persists after reload (IndexedDB)', false, e.message.slice(0, 100));
}

// 7. PNG export
try {
  const dl = page.waitForEvent('download', { timeout: 45000 });
  await page.getByRole('button', { name: /Square card/i }).first().click();
  const file = await dl;
  const fname = file.suggestedFilename();
  record('PNG export downloads', /-square\.png$/.test(fname), fname);
} catch (e) {
  record('PNG export downloads', false, e.message.slice(0, 100));
}

// 8. Public share
try {
  await page.getByRole('button', { name: /^Public$/ }).click();
  const field = page.getByLabel('Public share link');
  await field.waitFor({ timeout: 15000 });
  const url = await field.inputValue();
  // GitHub Pages serves the site from the lower-cased account host, so compare
  // the path part exactly and the host case-insensitively.
  const parsed = new URL(url);
  const looksRight =
    url.includes('#/dna/') && /^\/digital-dna\/$/i.test(parsed.pathname) && /github\.io$/i.test(parsed.hostname);
  record('Public share link generated', looksRight, `${url.length} chars · ${parsed.host}`);

  const fresh = await ctx.newPage();
  await fresh.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await fresh.getByText(/Shared view/i).waitFor({ timeout: 20000 });
  const sharedCode = await fresh.getByText(/^DNA-[0-9A-F]{6}$/).first().innerText();
  record('Shared link renders read-only with same DNA', sharedCode.trim() === code, sharedCode.trim());
  await fresh.close();
} catch (e) {
  record('Public share works on production', false, e.message.slice(0, 120));
}

// 9. Private mode — the link field must disappear once visibility is stored.
try {
  await page.getByRole('button', { name: /^Private$/ }).click();
  let gone = false;
  for (let i = 0; i < 30; i++) {
    if ((await page.getByLabel('Public share link').count()) === 0) {
      gone = true;
      break;
    }
    await page.waitForTimeout(200);
  }
  const hint = await page.getByText(/no share link is produced/i).count();
  record('Private mode exposes no link', gone && hint > 0, `${hint} explanatory notice`);
} catch (e) {
  record('Private mode exposes no link', false, e.message.slice(0, 100));
}

// 10. Compare
try {
  await page.goto(`${LIVE}#/compare`);
  await page.getByText(/Overall answer overlap/i).waitFor({ timeout: 20000 });
  const demoBadge = await page.getByText('Demo', { exact: true }).first().isVisible();
  record('Compare works with documented methods', demoBadge, 'Demo badge visible');
} catch (e) {
  record('Compare works with documented methods', false, e.message.slice(0, 100));
}

// 11. Evolution
try {
  await page.goto(`${LIVE}#/evolution`);
  await page.getByText(/Only one version so far|How your identity changed/i).waitFor({ timeout: 20000 });
  record('Evolution page renders', true);
} catch (e) {
  record('Evolution page renders', false, e.message.slice(0, 100));
}

// 12. No console errors
const realErrors = errors.filter((e) => !/favicon|404 \(Not Found\)/i.test(e));
record('No uncaught console errors', realErrors.length === 0, realErrors.slice(0, 2).join(' | ') || 'clean');

await ctx.close();

// ---------------------------------------------------------------- iPhone
const mctx = await browser.newContext({ ...devices['iPhone 13'] });
const mp = await mctx.newPage();
const mErrors = [];
mp.on('pageerror', (e) => mErrors.push(e.message));

try {
  await mp.goto(LIVE, { waitUntil: 'networkidle', timeout: 60000 });
  await mp.getByRole('heading', { level: 1 }).waitFor({ timeout: 20000 });
  record('iPhone: landing page renders', true);

  const mobileX = await mp.locator('header a[href="https://x.com/0xkillcoin"]').first().isVisible();
  record('iPhone: author X link visible', mobileX);

  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  record('iPhone: no horizontal overflow', overflow <= 1, `${overflow}px`);

  await mp.getByRole('button', { name: /Open menu/i }).click();
  await mp.waitForTimeout(400);
  const menuVisible = await mp.getByRole('link', { name: /^Create$/ }).first().isVisible();
  record('iPhone: mobile menu opens', menuVisible);

  await mp.goto(`${LIVE}#/create`);
  await mp.getByLabel(/Nickname/i).waitFor({ timeout: 20000 });
  const fs = await mp.getByLabel(/Nickname/i).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  record('iPhone: inputs >= 16px (no focus zoom)', fs >= 16, `${fs}px`);

  const createOverflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  record('iPhone: wizard has no overflow', createOverflow <= 1, `${createOverflow}px`);
} catch (e) {
  record('iPhone: functional checks', false, e.message.slice(0, 120));
}

record('iPhone: no uncaught errors', mErrors.length === 0, mErrors.slice(0, 2).join(' | ') || 'clean');

await mctx.close();
await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} production checks passed`);
if (failed.length) {
  console.log('FAILURES:');
  for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
}
process.exit(failed.length === 0 ? 0 : 1);

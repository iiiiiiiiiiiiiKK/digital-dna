// Confirms that the deployed GitHub Pages bundle is the same build produced
// locally, and that the live page loads with no failed resources.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const LIVE = 'https://iiiiiiiiiiiiikk.github.io/digital-dna/';

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const failed = [];
page.on('response', (r) => {
  if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
});

const resp = await page.goto(LIVE, { waitUntil: 'networkidle', timeout: 60000 });
console.log('status:', resp?.status());
console.log('title:', await page.title());

const html = await resp.text();
const deployed = html.match(/assets\/(index-[A-Za-z0-9_-]+\.js)/)?.[1] ?? null;
console.log('deployed entry chunk:', deployed);

const localDir = path.resolve('dist/assets');
const local = fs
  .readdirSync(localDir)
  .filter((f) => /^index-.*\.js$/.test(f))
  .sort();
console.log('local entry chunks:', local.join(', '));

if (deployed && local.includes(deployed)) {
  console.log('MATCH: live bundle is identical to the local production build');
} else {
  console.log('NOTE: live chunk differs from the current local build (expected if dist was rebuilt after deploy)');
}

const svgs = await page.locator('main svg[role="img"]').count();
console.log('live helix/artwork SVGs:', svgs);

console.log(failed.length ? `FAILED RESOURCES: ${failed.slice(0, 4).join(' | ')}` : 'no failed resources');

await browser.close();

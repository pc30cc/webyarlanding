import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const [,, html, out, w, h, dsf] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(()=>chromium.launch());
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dsf });
await p.goto('file://' + process.cwd() + '/' + html);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
await p.screenshot({ path: out });
await b.close();

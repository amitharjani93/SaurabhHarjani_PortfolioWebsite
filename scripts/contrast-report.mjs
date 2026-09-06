/**
 * Diagnostic: prints every axe colour-contrast violation with the computed
 * ratio and the elements involved. Not part of the suite.
 *
 *   node --import tsx scripts/contrast-report.mjs   (or run via Playwright)
 */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321/SaurabhHarjani_PortfolioWebsite/';
const paths = ['', 'contact', 'faq', 'insights', 'practice-areas', 'profile', 'legal-disclaimer'];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const seen = new Map();

for (const path of paths) {
  await page.goto(new URL(path, BASE).href, { waitUntil: 'load' });
  // Contrast must be measured on final styles, not a mid-transition frame.
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible')));

  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();

  for (const violation of violations) {
    for (const node of violation.nodes) {
      const detail = node.any[0]?.data ?? {};
      const key = `${violation.id}|${node.target.join(' ')}|${detail.fgColor}|${detail.bgColor}`;
      if (seen.has(key)) continue;
      seen.set(key, {
        rule: violation.id,
        page: path || '/',
        target: node.target.join(' '),
        fg: detail.fgColor,
        bg: detail.bgColor,
        ratio: detail.contrastRatio,
        needs: detail.expectedContrastRatio,
        size: detail.fontSize,
        weight: detail.fontWeight,
        html: node.html.slice(0, 110),
      });
    }
  }
}

console.table([...seen.values()], ['rule', 'page', 'fg', 'bg', 'ratio', 'needs', 'size', 'target']);
for (const v of seen.values()) console.log(`\n${v.page}  ${v.ratio} (needs ${v.needs})  ${v.fg} on ${v.bg}\n  ${v.html}`);

await browser.close();

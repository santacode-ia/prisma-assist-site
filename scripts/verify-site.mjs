import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
try {
  await page.goto(process.argv[2] || 'http://127.0.0.1:5187', { waitUntil: 'networkidle' });
  await expect(page.locator('.brand')).toContainText('ASSIST');
  await expect(page.locator('.panel')).toHaveCount(3);
  await expect(page.locator('.institutional-block')).toHaveCount(3);
  await expect(page.locator('.carousel-bar')).toHaveCount(3);
  await expect(page.locator('.benefit-current')).toHaveCount(0);
  await page.locator('.reference-carousel').scrollIntoViewIfNeeded();
  await page.locator('.carousel-container').focus();
  await page.keyboard.press('Home');
  const current = page.locator('.carousel-slide[data-current]');
  await expect(current).toContainText('Como funciona');
  await page.keyboard.press('ArrowRight');
  await expect(current).toContainText('Impacto na');
  await page.keyboard.press('ArrowLeft');
  await expect(current).toContainText('Como funciona');
  // The original component pauses autoplay while keyboard focus is inside
  await page.locator('.carousel-container').evaluate(e => e.blur());
  await page.mouse.move(2, 2);
  for (const label of ['Impacto na', 'Supervis', 'Como funciona']) {
    await expect(current).toContainText(label, { timeout: 4500 });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.scroll-stack')).toHaveCount(0);
  const frozen = await current.textContent();
  await page.waitForTimeout(3300);
  assert.equal(await current.textContent(), frozen);
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  assert.deepEqual(errors, []);
  console.log('PASS: branding, panels, institutional sections, carousel keyboard/loop, reduced motion, responsive overflow and console');
} finally {
  await browser.close();
}

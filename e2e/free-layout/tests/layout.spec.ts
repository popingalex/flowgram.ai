import { test, expect } from '@playwright/test';

test.describe('page render screen shot', () => {
  test('screenshot', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page).toHaveScreenshot('homepage.png');
  });
});

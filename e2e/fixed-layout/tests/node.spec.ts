import { test, expect } from '@playwright/test';

import PageModel from './models';

test.describe('node operations', () => {
  let editorPage: PageModel;

  test.beforeEach(async ({ page }) => {
    editorPage = new PageModel(page);
    await page.goto('http://localhost:3000');
  });

  test('node preview', async () => {
    const defaultNodeCount = await editorPage.getNodeCount();
    expect(defaultNodeCount).toEqual(10);
  });

  test('add node', async () => {
    await editorPage.insert('condition', {
      from: 'llm_0',
      to: 'loop_0',
    });
    const defaultNodeCount = await editorPage.getNodeCount();
    expect(defaultNodeCount).toEqual(13);
  });
});

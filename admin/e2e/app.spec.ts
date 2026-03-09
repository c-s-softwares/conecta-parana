import { test, expect } from '@playwright/test';

test.describe('Admin App', () => {
  test('should display the application title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Conecta Paraná Admin');
  });

  test('should display the environment badge', async ({ page }) => {
    await page.goto('/');
    const badge = page.locator('main span');
    await expect(badge).toBeVisible();
  });
});

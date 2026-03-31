import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display EventBook heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Find the Perfect Vendors' })).toBeVisible();
  });

  test('should have navigation to search page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /find vendors/i }).click();
    await expect(page).toHaveURL('/search');
  });

  test('should have login and register links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });
});

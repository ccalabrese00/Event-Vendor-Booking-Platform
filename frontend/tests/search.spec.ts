import { test, expect } from '@playwright/test';

test.describe('Vendor Search', () => {
  test('should display search page', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: /find vendors/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search vendors/i)).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    await page.goto('/search');
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption('DJ');
    await expect(categorySelect).toHaveValue('DJ');
  });

  test('should show available only checkbox', async ({ page }) => {
    await page.goto('/search');
    const checkbox = page.getByLabel(/show only vendors with available dates/i);
    await expect(checkbox).toBeVisible();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });
});
